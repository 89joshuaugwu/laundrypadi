"use client";

import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getDb } from "@/lib/firebase";
import {
  toBooking,
  toCustomer,
  toOrder,
  toOwnerShop,
  type BookingDoc,
  type CustomerDoc,
  type OrderDoc,
  type OwnerShop,
} from "@/lib/models";
import { useAuth } from "../AuthProvider";

interface OwnerData {
  loading: boolean;
  error: string;
  shop: OwnerShop | null;
  orders: OrderDoc[];
  bookings: BookingDoc[];
  pending: BookingDoc[];
  customers: CustomerDoc[];
}

const Ctx = createContext<OwnerData>({ loading: true, error: "", shop: null, orders: [], bookings: [], pending: [], customers: [] });
export const useOwner = () => useContext(Ctx);

/** Live (real-time) data for the signed-in shop owner. Firestore rules only ever return their own documents. */
export function OwnerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shop, setShop] = useState<OwnerShop | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [customers, setCustomers] = useState<CustomerDoc[]>([]);
  const [loaded, setLoaded] = useState({ shop: false, orders: false, bookings: false, customers: false });
  const [error, setError] = useState("");

  useEffect(() => {
    const db = getDb();
    if (!user || !db) return;
    const mark = (k: keyof typeof loaded) => setLoaded((l) => ({ ...l, [k]: true }));
    const fail = () => setError("We could not load your shop data. Check that the Firestore rules are published, then refresh.");
    const mine = (name: string) => query(collection(db, name), where("ownerId", "==", user.uid));

    const offs = [
      onSnapshot(query(collection(db, "shops"), where("ownerId", "==", user.uid), limit(1)), (snap) => {
        setShop(snap.empty ? null : toOwnerShop(snap.docs[0].id, snap.docs[0].data()));
        mark("shop");
      }, fail),
      onSnapshot(mine("orders"), (snap) => {
        setOrders(snap.docs.map((d) => toOrder(d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        mark("orders");
      }, fail),
      onSnapshot(mine("bookings"), (snap) => {
        setBookings(snap.docs.map((d) => toBooking(d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        mark("bookings");
      }, fail),
      onSnapshot(mine("customers"), (snap) => {
        setCustomers(snap.docs.map((d) => toCustomer(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name)));
        mark("customers");
      }, fail),
    ];
    return () => offs.forEach((off) => off());
  }, [user]);

  const value = useMemo<OwnerData>(
    () => ({
      loading: !error && !(loaded.shop && loaded.orders && loaded.bookings && loaded.customers),
      error,
      shop,
      orders,
      bookings,
      pending: bookings.filter((b) => b.status === "pending"),
      customers,
    }),
    [error, loaded, shop, orders, bookings, customers],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
