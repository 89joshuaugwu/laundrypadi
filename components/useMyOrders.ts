"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import { toBooking, toOrder, type BookingDoc, type OrderDoc } from "@/lib/models";
import { useAuth } from "./AuthProvider";

/** Live list of the signed-in customer's linked orders and pending booking requests. */
export function useMyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loaded, setLoaded] = useState({ orders: false, bookings: false });
  const [error, setError] = useState("");

  useEffect(() => {
    const db = getDb();
    if (!user || !db) return;
    const fail = () => setError("We could not load your orders. Please refresh and try again.");
    const offOrders = onSnapshot(
      query(collection(db, "orders"), where("customerUid", "==", user.uid)),
      (snap) => {
        setOrders(snap.docs.map((d) => toOrder(d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
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
  }, [user]);

  return { orders, bookings, loading: !(loaded.orders && loaded.bookings) && !error, error };
}
