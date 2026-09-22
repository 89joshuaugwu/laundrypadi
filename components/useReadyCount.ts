"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

/** How many of the signed-in customer's orders are ready for collection right now. Powers the nav badge. */
export function useReadyCount(): number {
  const { user, profile } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const db = getDb();
    if (!user || !db || profile?.role !== "customer") {
      setCount(0);
      return;
    }
    return onSnapshot(
      query(collection(db, "orders"), where("customerUid", "==", user.uid), where("status", "==", "ready")),
      (snap) => setCount(snap.size),
      () => setCount(0),
    );
  }, [user, profile?.role]);

  return count;
}
