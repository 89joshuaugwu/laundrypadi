import type { Shop, TrackedOrder } from "./types";

/** Illustrative data used only when Firebase Admin is not configured (local preview). */
export const demoShop: Shop = {
  id: "demo-freshfold",
  slug: "freshfold",
  name: "FreshFold Laundry",
  area: "Independence Layout, Enugu",
  landmark: "Near Independence Layout Market",
  days: "Mon \u2013 Sat",
  hours: "8:00 AM \u2013 7:00 PM",
  accepting: true,
  whatsapp: "2348031234567",
  coverUrl: "/images/hero-towels.jpg",
  services: [
    { id: "shirts", name: "Shirts", unit: "per item", price: 1000, active: true },
    { id: "trousers", name: "Trousers", unit: "per item", price: 1500, active: true },
    { id: "duvet", name: "Duvet", unit: "per item", price: 4000, active: true },
  ],
};

export const demoOrder: TrackedOrder = {
  ref: "LP-1042",
  shopName: "FreshFold Laundry",
  shopArea: "Independence Layout, Enugu",
  shopWhatsapp: "2348031234567",
  itemsLabel: "5 shirts",
  status: "ready",
  timeline: { received: "2026-09-20", washing: "2026-09-21", ready: "2026-09-22" },
  collectionDate: "2026-09-23",
  total: 5000,
  paid: 2000,
};

export const demoOrderPhone = "08031234567";
