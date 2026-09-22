"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { getDb } from "@/lib/firebase";
import { toBooking, toOrder, type BookingDoc, type OrderDoc } from "@/lib/models";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

const STATUS_MESSAGE: Partial<Record<OrderDoc["status"], string>> = {
  washing: "is now being washed.",
  ready: "is ready for collection!",
  collected: "has been marked collected. Thank you!",
};

/** Live list of the signed-in customer's linked orders and pending booking requests. */
export function useMyOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loaded, setLoaded] = useState({ orders: false, bookings: false });
  const [error, setError] = useState("");
  const seenOrders = useRef<Map<string, OrderDoc["status"]> | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!user || !db) return;
    const fail = () => setError("We could not load your orders. Please refresh and try again.");
    const offOrders = onSnapshot(
      query(collection(db, "orders"), where("customerUid", "==", user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => toOrder(d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (seenOrders.current) {
          for (const o of list) {
            const before = seenOrders.current.get(o.ref);
            if (!before) {
              // A brand-new order the customer didn't just create themselves means a booking was accepted.
              toast({ title: `Order ${o.ref} created`, body: `${o.shopName} confirmed your booking.`, href: `/account/orders/${o.ref}` });
            } else if (before !== o.status) {
              const msg = STATUS_MESSAGE[o.status];
              if (msg) toast({ title: `Order ${o.ref}`, body: `${o.shopName ? `${o.shopName}: ` : ""}Your order ${msg}`, href: `/account/orders/${o.ref}` });
            }
          }
        }
        seenOrders.current = new Map(list.map((o) => [o.ref, o.status]));
        setOrders(list);
        setLoaded((l) => ({ ...l, orders: true }));
      },
      fail,
    );
    const offBookings = onSnapshot(
      query(collection(db, "bookings"), where("customerUid", "==", user.uid)),
      (snap) => {
        setBookings(snap.docs.map((d) => toBooking(d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setLoaded((l) => ({ ...l, bookings: true }));
      },
      fail,
    );
    return () => {
      offOrders();
      offBookings();
    };
  }, [user, toast]);

  return { orders, bookings, loading: !(loaded.orders && loaded.bookings) && !error, error };
}
