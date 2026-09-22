import type { BookingLine, OrderStatus, Service } from "./types";

export type PaymentMethod = "cash" | "transfer";
export const METHOD_LABEL: Record<PaymentMethod, string> = { cash: "Cash", transfer: "Bank transfer" };

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  at: string; // ISO timestamp
}

export interface OrderItem {
  serviceId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ActivityEntry {
  at: string;
  text: string;
}

/** Firestore `orders/{ref}`. Written only by API routes; read by the owning shop and the linked customer. */
export interface OrderDoc {
  ref: string;
  ownerId: string;
  shopId: string;
  shopSlug: string;
  shopName: string;
  shopArea: string;
  shopWhatsapp: string;
  customerId: string;
  customerName: string;
  customerUid: string | null;
  phone: string;
  phoneNormalized: string;
  items: OrderItem[];
  itemsLabel: string;
  total: number;
  paid: number;
  payments: Payment[];
  status: OrderStatus;
  timeline: Partial<Record<OrderStatus, string>>;
  collectionDate: string;
  notes: string;
  activity: ActivityEntry[];
  source: "walk-in" | "booking";
  bookingRef: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDoc {
  ref: string;
  ownerId: string;
  shopId: string;
  shopSlug: string;
  status: "pending" | "accepted" | "declined";
  customerName: string;
  customerUid: string | null;
  phone: string;
  phoneNormalized: string;
  items: BookingLine[];
  estimatedTotal: number;
  preferredDate: string;
  notes: string;
  orderRef: string;
  createdAt: string;
}

export interface CustomerDoc {
  id: string;
  ownerId: string;
  shopId: string;
  name: string;
  phone: string;
  phoneNormalized: string;
  createdAt: string;
}

export interface Subscription {
  plan: string;
  monthly: number;
  setupFee: number;
  setupPaid: boolean;
  status: string;
  nextInvoice: string;
  lastPaymentAt: string;
}

export interface OwnerShop {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  area: string;
  landmark: string;
  days: string;
  hours: string;
  accepting: boolean;
  phone: string;
  whatsapp: string;
  logoUrl: string;
  coverUrl: string;
  services: Service[];
  subscription: Subscription;
  suspended: boolean;
  suspendedReason: string;
  suspendedAt: string;
  createdAt: string;
}

export const UNITS = ["Per item", "Per kg", "Per pair", "Per set"] as const;

/* ---------- Firestore -> typed objects (defensive: old or partial documents never crash the UI) ---------- */

function s(v: unknown, d = ""): string {
  return typeof v === "string" ? v : d;
}
function n(v: unknown, d = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}
export function iso(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: unknown }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function toOrder(d: Record<string, unknown>): OrderDoc {
  return {
    ref: s(d.ref),
    ownerId: s(d.ownerId),
    shopId: s(d.shopId),
    shopSlug: s(d.shopSlug),
    shopName: s(d.shopName),
    shopArea: s(d.shopArea),
    shopWhatsapp: s(d.shopWhatsapp),
    customerId: s(d.customerId),
    customerName: s(d.customerName, "Customer"),
    customerUid: typeof d.customerUid === "string" ? d.customerUid : null,
    phone: s(d.phone),
    phoneNormalized: s(d.phoneNormalized),
    items: arr<OrderItem>(d.items),
    itemsLabel: s(d.itemsLabel),
    total: n(d.total),
    paid: n(d.paid),
    payments: arr<Payment>(d.payments),
    status: (["received", "washing", "ready", "collected"].includes(s(d.status)) ? d.status : "received") as OrderStatus,
    timeline: (d.timeline && typeof d.timeline === "object" ? d.timeline : {}) as OrderDoc["timeline"],
    collectionDate: s(d.collectionDate),
    notes: s(d.notes),
    activity: arr<ActivityEntry>(d.activity),
    source: d.source === "booking" ? "booking" : "walk-in",
    bookingRef: s(d.bookingRef),
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
  };
}

export function toBooking(d: Record<string, unknown>): BookingDoc {
  return {
    ref: s(d.ref),
    ownerId: s(d.ownerId),
    shopId: s(d.shopId),
    shopSlug: s(d.shopSlug),
    status: d.status === "accepted" || d.status === "declined" ? d.status : "pending",
    customerName: s(d.customerName, "Customer"),
    customerUid: typeof d.customerUid === "string" ? d.customerUid : null,
    phone: s(d.phone),
    phoneNormalized: s(d.phoneNormalized),
    items: arr<BookingLine>(d.items),
    estimatedTotal: n(d.estimatedTotal),
    preferredDate: s(d.preferredDate),
    notes: s(d.notes),
    orderRef: s(d.orderRef),
    createdAt: iso(d.createdAt),
  };
}

export function toCustomer(id: string, d: Record<string, unknown>): CustomerDoc {
  return {
    id,
    ownerId: s(d.ownerId),
    shopId: s(d.shopId),
    name: s(d.name, "Customer"),
    phone: s(d.phone),
    phoneNormalized: s(d.phoneNormalized),
    createdAt: iso(d.createdAt),
  };
}

export function toOwnerShop(id: string, d: Record<string, unknown>): OwnerShop {
  const sub = (d.subscription && typeof d.subscription === "object" ? d.subscription : {}) as Record<string, unknown>;
  return {
    id,
    ownerId: s(d.ownerId),
    slug: s(d.slug, id),
    name: s(d.name, "Your shop"),
    area: s(d.area),
    landmark: s(d.landmark),
    days: s(d.days, "Mon \u2013 Sat"),
    hours: s(d.hours, "8:00 AM \u2013 7:00 PM"),
    accepting: d.accepting !== false,
    phone: s(d.phone),
    whatsapp: s(d.whatsapp),
    logoUrl: s(d.logoUrl),
    coverUrl: s(d.coverUrl),
    services: arr<Service>(d.services),
    subscription: {
      plan: s(sub.plan, "launch"),
      monthly: n(sub.monthly, 5000),
      setupFee: n(sub.setupFee, 15000),
      setupPaid: sub.setupPaid === true,
      status: s(sub.status, "pending"),
      nextInvoice: s(sub.nextInvoice),
      lastPaymentAt: s(sub.lastPaymentAt),
    },
    suspended: d.suspended === true,
    suspendedReason: s(d.suspendedReason),
    suspendedAt: iso(d.suspendedAt),
    createdAt: iso(d.createdAt),
  };
}

/* ---------- Derived helpers ---------- */

export const balanceOf = (o: Pick<OrderDoc, "total" | "paid">) => Math.max(0, o.total - o.paid);

export function isOverdue(o: Pick<OrderDoc, "status" | "collectionDate">, today: string): boolean {
  return o.status !== "collected" && !!o.collectionDate && o.collectionDate < today;
}
