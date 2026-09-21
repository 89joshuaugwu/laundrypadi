import { NextResponse } from "next/server";
import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "./firebase-admin";
import { clientIp, rateLimit } from "./rate-limit";
import type { OrderItem } from "./models";
import { cleanText, normalizePhone, toInt } from "./validate";
import type { Service } from "./types";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export interface Caller {
  uid: string;
  email: string | null;
}

/** Verifies the Firebase ID token in the Authorization header. Returns null when missing or invalid. */
export async function getCaller(req: Request): Promise<Caller | null> {
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "");
  const auth = getAdminAuth();
  if (!m || !auth) return null;
  try {
    const t = await auth.verifyIdToken(m[1]);
    return { uid: t.uid, email: t.email ?? null };
  } catch {
    return null;
  }
}

export interface OwnerContext {
  db: Firestore;
  uid: string;
  shopId: string;
  shop: DocumentData;
}

/** Signed-in shop owner (and their shop). Every owner route starts here. */
export async function authOwner(
  req: Request,
  needShop = true,
): Promise<{ ctx: OwnerContext | { db: Firestore; uid: string; shopId: ""; shop: null } } | { res: NextResponse }> {
  const db = getAdminDb();
  if (!db) return { res: jsonError("The server is not connected to Firebase yet.", 503) };
  const caller = await getCaller(req);
  if (!caller) return { res: jsonError("Please sign in again.", 401) };
  if (!rateLimit(`owner:${caller.uid}:${clientIp(req)}`, 120)) return { res: jsonError("Too many requests. Slow down a little.", 429) };

  const profile = await db.collection("users").doc(caller.uid).get();
  if (profile.data()?.role !== "owner") return { res: jsonError("This needs a shop owner account.", 403) };

  const snap = await db.collection("shops").where("ownerId", "==", caller.uid).limit(1).get();
  if (snap.empty) {
    if (needShop) return { res: jsonError("Set up your shop first.", 409) };
    return { ctx: { db, uid: caller.uid, shopId: "", shop: null } };
  }
  return { ctx: { db, uid: caller.uid, shopId: snap.docs[0].id, shop: snap.docs[0].data() } };
}

/** Next order reference, LP-1001, LP-1002, ... shared across all shops so a reference is globally unique. */
export async function nextOrderRef(db: Firestore): Promise<string> {
  const counter = db.collection("counters").doc("orders");
  const n = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counter);
    const cur = snap.exists && typeof snap.data()?.next === "number" ? (snap.data()!.next as number) : 1001;
    tx.set(counter, { next: cur + 1 });
    return cur;
  });
  return `LP-${n}`;
}

export function itemsLabelOf(items: OrderItem[]): string {
  return items
    .filter((i) => i.serviceId !== "adjustment")
    .map((i) => `${i.qty} ${i.name.toLowerCase()}`)
    .join(", ");
}

/** Customers are keyed by shop + phone, so the same person is never duplicated in one shop. */
export async function upsertCustomer(
  db: Firestore,
  o: { ownerId: string; shopId: string; name: string; phone: string },
): Promise<{ id: string; name: string; phone: string; phoneNormalized: string }> {
  const phoneNormalized = normalizePhone(o.phone);
  const id = `${o.shopId}-${phoneNormalized}`;
  const ref = db.collection("customers").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      ownerId: o.ownerId,
      shopId: o.shopId,
      name: o.name,
      phone: o.phone,
      phoneNormalized,
      createdAt: new Date().toISOString(),
    });
    return { id, name: o.name, phone: o.phone, phoneNormalized };
  }
  const d = snap.data()!;
  return { id, name: String(d.name), phone: String(d.phone), phoneNormalized };
}

/** Validates order lines sent by an owner. Prices are the owner's to set, but must be sane numbers. */
export function parseItems(
  raw: unknown,
  services: Service[],
): { ok: true; items: OrderItem[]; total: number } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: "Add at least one item." };
  if (raw.length > 30) return { ok: false, error: "That is too many items for one order." };
  const items: OrderItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return { ok: false, error: "One of the items is not valid." };
    const o = r as Record<string, unknown>;
    const service = services.find((s) => s.id === o.serviceId);
    const name = service?.name ?? cleanText(o.name, 40);
    const qty = toInt(o.qty, 1, 999);
    const unitPrice = toInt(o.unitPrice, 0, 10_000_000);
    if (!name) return { ok: false, error: "Every item needs a name." };
    if (qty === null) return { ok: false, error: `Check the quantity for ${name}.` };
    if (unitPrice === null) return { ok: false, error: `Check the price for ${name}.` };
    items.push({ serviceId: service?.id ?? "custom", name, qty, unitPrice });
  }
  return { ok: true, items, total: items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0) };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
