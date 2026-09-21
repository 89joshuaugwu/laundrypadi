export type OrderStatus = "received" | "washing" | "ready" | "collected";

export const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "washing", label: "Washing" },
  { status: "ready", label: "Ready" },
  { status: "collected", label: "Collected" },
];

export interface Service {
  id: string;
  name: string;
  unit: string; // e.g. "per item"
  price: number; // naira, whole numbers
  active: boolean;
}

/** Public-facing shop data. Private fields (ownerId, subscription) never leave the server. */
export interface Shop {
  id: string;
  slug: string;
  name: string;
  area: string;
  landmark: string;
  days: string;
  hours: string;
  accepting: boolean;
  whatsapp: string;
  coverUrl: string;
  services: Service[];
}

export interface BookingLine {
  serviceId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

/**
 * Firestore shape for `orders/{id}` (written by the shop-owner dashboard, next build step).
 * The guest tracker reads it server-side only and returns TrackedOrder.
 */
export interface TrackedOrder {
  ref: string;
  shopName: string;
  shopArea: string;
  shopWhatsapp: string;
  itemsLabel: string;
  status: OrderStatus;
  timeline: Partial<Record<OrderStatus, string>>; // ISO dates
  collectionDate: string;
  total: number;
  paid: number;
}
