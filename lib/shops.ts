import { cache } from "react";
import { demoShop } from "./demo";
import { getAdminDb } from "./firebase-admin";
import type { Service, Shop } from "./types";

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function toServices(v: unknown): Service[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((s): Service | null => {
      if (!s || typeof s !== "object") return null;
      const o = s as Record<string, unknown>;
      const price = Number(o.price);
      if (typeof o.id !== "string" || typeof o.name !== "string" || !Number.isFinite(price)) return null;
      return { id: o.id, name: o.name, unit: str(o.unit, "per item"), price, active: o.active !== false };
    })
    .filter((s): s is Service => s !== null);
}

/** Reads a shop through the Admin SDK. Client-side Firestore rules keep `shops` private to its owner. */
export const getShopBySlug = cache(async (slug: string): Promise<Shop | null> => {
  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
  if (!clean) return null;

  const db = getAdminDb();
  if (!db) return clean === demoShop.slug ? demoShop : null;

  const snap = await db.collection("shops").where("slug", "==", clean).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const d = doc.data();
  if (d.published === false) return null;

  return {
    id: doc.id,
    slug: clean,
    name: str(d.name, "Laundry shop"),
    area: str(d.area),
    landmark: str(d.landmark),
    days: str(d.days, "Mon \u2013 Sat"),
    hours: str(d.hours, "8:00 AM \u2013 7:00 PM"),
    accepting: d.accepting !== false,
    whatsapp: str(d.whatsapp),
    coverUrl: str(d.coverUrl),
    services: toServices(d.services).filter((s) => s.active),
  };
});
