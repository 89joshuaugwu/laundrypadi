import { NextResponse } from "next/server";
import { authOwner, jsonError, newId } from "@/lib/server";
import { UNITS } from "@/lib/models";
import type { Service } from "@/lib/types";
import { cleanText, isCloudinaryUrl, isValidNgPhone, normalizePhone, toInt } from "@/lib/validate";

export const runtime = "nodejs";

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

function parseServices(raw: unknown, existing: Service[] = []): Service[] | string {
  if (!Array.isArray(raw)) return "Services are not valid.";
  if (raw.length > 40) return "That is too many services.";
  const out: Service[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return "One of the services is not valid.";
    const o = r as Record<string, unknown>;
    const name = cleanText(o.name, 40);
    const unit = cleanText(o.unit, 20);
    const price = toInt(o.price, 0, 10_000_000);
    if (!name) return "Every service needs a name.";
    if (!(UNITS as readonly string[]).includes(unit)) return `Choose a unit for ${name}.`;
    if (price === null) return `Check the price for ${name}.`;
    const known = existing.find((e) => e.id === o.id);
    out.push({ id: known ? known.id : `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}-${newId().slice(0, 4)}`, name, unit, price, active: o.active !== false });
  }
  return out;
}

/** Create the owner's shop (onboarding). The public link is the document id, so it is unique by construction. */
export async function POST(req: Request) {
  const a = await authOwner(req, false);
  if ("res" in a) return a.res;
  const { db, uid, shop } = a.ctx;
  if (shop) return jsonError("You already have a shop.", 409);

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }

  const name = cleanText(b.name, 60);
  const slug = cleanText(b.slug, 40).toLowerCase();
  const phone = cleanText(b.phone, 20);
  const area = cleanText(b.area, 120);
  const landmark = cleanText(b.landmark, 120);
  const days = cleanText(b.days, 30) || "Mon \u2013 Sat";
  const hours = cleanText(b.hours, 30) || "8:00 AM \u2013 7:00 PM";
  const logoUrl = cleanText(b.logoUrl, 400);
  const coverUrl = cleanText(b.coverUrl, 400);

  if (name.length < 2) return jsonError("Enter your business name.", 400);
  if (!SLUG.test(slug)) return jsonError("Your shop link can use lowercase letters, numbers and hyphens (3 to 40 characters).", 400);
  if (!isValidNgPhone(phone)) return jsonError("Enter a valid Nigerian phone number, like 0803 123 4567.", 400);
  if (area.length < 2) return jsonError("Enter your business address.", 400);
  if (!isCloudinaryUrl(logoUrl) || !isCloudinaryUrl(coverUrl)) return jsonError("That image link is not allowed.", 400);

  const services = parseServices(b.services ?? []);
  if (typeof services === "string") return jsonError(services, 400);

  const normalized = normalizePhone(phone);
  try {
    await db.collection("shops").doc(slug).create({
      ownerId: uid,
      slug,
      name,
      area,
      landmark,
      days,
      hours,
      accepting: true,
      phone: normalized,
      whatsapp: normalized,
      logoUrl,
      coverUrl,
      services,
      published: true,
      subscription: { plan: "launch", monthly: 5000, setupFee: 15000, setupPaid: false, status: "pending", nextInvoice: "", lastPaymentAt: "" },
      suspended: false,
      suspendedReason: "",
      suspendedAt: "",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 6) return jsonError("That shop link is already taken. Try another.", 409);
    return jsonError("We could not create your shop. Please try again.", 500);
  }
  return NextResponse.json({ ok: true, slug });
}

/** Update profile, opening hours, accepting toggle, images and/or the price list. */
export async function PATCH(req: Request) {
  const a = await authOwner(req);
  if ("res" in a) return a.res;
  const { db, shopId, shop } = a.ctx;
  if (!shop) return jsonError("Set up your shop first.", 409);

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }

  const patch: Record<string, unknown> = {};
  if ("name" in b) {
    const v = cleanText(b.name, 60);
    if (v.length < 2) return jsonError("Enter your business name.", 400);
    patch.name = v;
  }
  if ("phone" in b) {
    const v = cleanText(b.phone, 20);
    if (!isValidNgPhone(v)) return jsonError("Enter a valid Nigerian phone number.", 400);
    patch.phone = normalizePhone(v);
    patch.whatsapp = normalizePhone(v);
  }
  if ("area" in b) {
    const v = cleanText(b.area, 120);
    if (v.length < 2) return jsonError("Enter your business address.", 400);
    patch.area = v;
  }
  if ("landmark" in b) patch.landmark = cleanText(b.landmark, 120);
  if ("days" in b) patch.days = cleanText(b.days, 30);
  if ("hours" in b) patch.hours = cleanText(b.hours, 30);
  if ("accepting" in b) patch.accepting = b.accepting === true;
  for (const key of ["logoUrl", "coverUrl"] as const) {
    if (key in b) {
      const v = cleanText(b[key], 400);
      if (!isCloudinaryUrl(v)) return jsonError("That image link is not allowed.", 400);
      patch[key] = v;
    }
  }
  if ("services" in b) {
    const s = parseServices(b.services, (shop.services ?? []) as Service[]);
    if (typeof s === "string") return jsonError(s, 400);
    patch.services = s;
  }
  if (Object.keys(patch).length === 0) return jsonError("Nothing to update.", 400);

  await db.collection("shops").doc(shopId).update(patch);
  return NextResponse.json({ ok: true });
}
