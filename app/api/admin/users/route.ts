import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { authAdmin, jsonError } from "@/lib/server";

export const runtime = "nodejs";

/**
 * Merges Firebase Auth accounts (for email + disabled status) with the `users` Firestore docs
 * (for name + role). listUsers() is one paginated call rather than one read per person.
 */
export async function GET(req: Request) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  const { db } = a.ctx;
  const auth = getAdminAuth();
  if (!auth) return jsonError("The server is not connected to Firebase yet.", 503);

  const [authUsers, profileSnap] = await Promise.all([auth.listUsers(1000), db.collection("users").get()]);
  const profiles = new Map(profileSnap.docs.map((d) => [d.id, d.data()]));

  const users = authUsers.users
    .map((u) => {
      const p = profiles.get(u.uid);
      return {
        uid: u.uid,
        email: u.email ?? "",
        name: (p?.name as string) ?? u.displayName ?? "",
        role: p?.role === "owner" ? "owner" : p?.role === "customer" ? "customer" : "unknown",
        disabled: u.disabled,
        createdAt: u.metadata.creationTime,
      };
    })
    .sort((x, y) => (y.createdAt ?? "").localeCompare(x.createdAt ?? ""));

  return NextResponse.json({ ok: true, users });
}
