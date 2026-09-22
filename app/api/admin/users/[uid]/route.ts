import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { authAdmin, jsonError } from "@/lib/server";

export const runtime = "nodejs";

/**
 * Locks or unlocks sign-in. Disabling also revokes refresh tokens (kills any open session
 * immediately, not just future sign-ins) and mirrors a `disabled` flag onto the Firestore
 * profile so a device that is already signed in notices and signs itself out right away,
 * rather than waiting up to an hour for its cached token to expire.
 */
export async function PATCH(req: Request, { params }: { params: { uid: string } }) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  const { db, uid: adminUid } = a.ctx;
  if (params.uid === adminUid) return jsonError("You can't lock your own account.", 400);

  const auth = getAdminAuth();
  if (!auth) return jsonError("The server is not connected to Firebase yet.", 503);

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }
  if (b.action !== "disable" && b.action !== "enable") return jsonError("Unknown action.", 400);
  const disable = b.action === "disable";

  try {
    await auth.updateUser(params.uid, { disabled: disable });
    if (disable) await auth.revokeRefreshTokens(params.uid);
  } catch {
    return jsonError("We could not find that account.", 404);
  }
  await db.collection("users").doc(params.uid).set({ disabled: disable }, { merge: true });
  return NextResponse.json({ ok: true });
}
