import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCaller } from "@/lib/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getShopBySlug } from "@/lib/shops";
import type { BookingLine } from "@/lib/types";
import { cleanText, isIsoDate, isValidNgPhone, normalizePhone } from "@/lib/validate";

export const runtime = "nodejs";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function makeRef(): string {
  const bytes = randomBytes(5);
  let out = "BR-";
  for (let i = 0; i < 5; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  if (!rateLimit(`book:${clientIp(req)}`, 6)) {
    return fail("Too many requests. Please wait a minute and try again.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("That request could not be read. Please try again.", 400);
  }

  // Honeypot: real people never fill this hidden field. Pretend success so bots learn nothing.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true, ref: makeRef(), total: 0 });
  }

  const shop = await getShopBySlug(cleanText(body.shopSlug, 60));
  if (!shop) return fail("We could not find that shop.", 404);
  if (!shop.accepting) return fail(`${shop.name} is not accepting requests right now.`, 409);

  const name = cleanText(body.name, 80);
  const phoneRaw = cleanText(body.phone, 20);
  const notes = cleanText(body.notes, 500, true);
  const date = cleanText(body.date, 10);

  if (name.length < 2) return fail("Enter your full name.", 400);
  if (!isValidNgPhone(phoneRaw)) return fail("Enter a valid Nigerian phone number, like 0803 123 4567.", 400);
  if (!isIsoDate(date) || date < new Date().toISOString().slice(0, 10)) {
    return fail("Choose a collection date from today onwards.", 400);
  }

  // Prices always come from the shop's own list, never from the browser.
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  const lines: BookingLine[] = [];
  for (const item of rawItems) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const service = shop.services.find((s) => s.id === o.serviceId);
    const qty = Math.floor(Number(o.qty));
    if (!service || !Number.isFinite(qty) || qty < 1 || qty > 99) continue;
    lines.push({ serviceId: service.id, name: service.name, qty, unitPrice: service.price });
  }
  if (lines.length === 0) return fail("Add at least one item to your request.", 400);
  const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);

  const db = getAdminDb();
  if (!db) {
    // Demo mode: nothing is stored. Add the Firebase Admin keys to persist requests.
    return NextResponse.json({ ok: true, ref: makeRef(), total, demo: true });
  }

  // Server-only owner id (public shop data never carries it) and the optional signed-in customer.
  const rawShop = await db.collection("shops").doc(shop.id).get();
  const ownerId = typeof rawShop.data()?.ownerId === "string" ? (rawShop.data()!.ownerId as string) : "";
  const caller = await getCaller(req);

  for (let attempt = 0; attempt < 4; attempt++) {
    const ref = makeRef();
    try {
      await db.collection("bookings").doc(ref).create({
        ref,
        shopId: shop.id,
        shopSlug: shop.slug,
        ownerId,
        customerUid: caller?.uid ?? null,
        status: "pending",
        customerName: name,
        phone: phoneRaw,
        phoneNormalized: normalizePhone(phoneRaw),
        dropOff: "shop",
        items: lines,
        estimatedTotal: total,
        preferredDate: date,
        notes,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, ref, total });
    } catch (err) {
      // 6 = ALREADY_EXISTS: pick another reference and retry.
      if ((err as { code?: number }).code !== 6) break;
    }
  }
  return fail("We could not save your request. Please try again.", 500);
}
