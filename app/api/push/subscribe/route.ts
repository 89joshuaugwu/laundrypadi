import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { pushConfigured } from "@/lib/push";
import { getCaller, jsonError } from "@/lib/server";

export const runtime = "nodejs";

/** A stable id per browser subscription, so re-subscribing on the same device updates rather than duplicates. */
function idFor(endpoint: string): string {
  let h = 0;
  for (let i = 0; i < endpoint.length; i++) h = (Math.imul(h, 31) + endpoint.charCodeAt(i)) | 0;
  return `p${(h >>> 0).toString(36)}`;
}

interface SubBody {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

export async function POST(req: Request) {
  if (!pushConfigured) return jsonError("Push notifications are not set up yet.", 503);
  const db = getAdminDb();
  if (!db) return jsonError("The server is not connected to Firebase yet.", 503);
  const caller = await getCaller(req);
  if (!caller) return jsonError("Please sign in again.", 401);

  let b: SubBody;
  try {
    b = (await req.json()) as SubBody;
  } catch {
    return jsonError("That request could not be read.", 400);
  }
  const endpoint = typeof b.endpoint === "string" ? b.endpoint : "";
  const p256dh = typeof b.keys?.p256dh === "string" ? b.keys.p256dh : "";
  const auth = typeof b.keys?.auth === "string" ? b.keys.auth : "";
  if (!endpoint.startsWith("https://") || !p256dh || !auth) return jsonError("That subscription is not valid.", 400);

  await db.collection("pushSubscriptions").doc(idFor(endpoint)).set({
    uid: caller.uid,
    endpoint,
    keys: { p256dh, auth },
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const db = getAdminDb();
  if (!db) return jsonError("The server is not connected to Firebase yet.", 503);
  const caller = await getCaller(req);
  if (!caller) return jsonError("Please sign in again.", 401);

  let b: SubBody;
  try {
    b = (await req.json()) as SubBody;
  } catch {
    return jsonError("That request could not be read.", 400);
  }
  const endpoint = typeof b.endpoint === "string" ? b.endpoint : "";
  if (!endpoint) return jsonError("Missing subscription.", 400);

  const ref = db.collection("pushSubscriptions").doc(idFor(endpoint));
  const snap = await ref.get();
  if (snap.exists && snap.data()?.uid === caller.uid) await ref.delete();
  return NextResponse.json({ ok: true });
}

/** Whether this signed-in person has at least one push subscription saved, for the toggle's initial state. */
export async function GET(req: Request) {
  const db = getAdminDb();
  if (!db) return jsonError("The server is not connected to Firebase yet.", 503);
  const caller = await getCaller(req);
  if (!caller) return jsonError("Please sign in again.", 401);
  const snap = await db.collection("pushSubscriptions").where("uid", "==", caller.uid).limit(1).get();
  return NextResponse.json({ ok: true, subscribed: !snap.empty });
}
