import "server-only";
import webpush from "web-push";
import type { Firestore } from "firebase-admin/firestore";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
export const pushConfigured = Boolean(publicKey && privateKey);

if (pushConfigured) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@laundrypadi.example", publicKey!, privateKey!);
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

/**
 * Sends a push to every subscribed device for one person. Never throws: notifications are a
 * courtesy, not something that should fail the order update or booking action that triggered it.
 * A subscription the browser has revoked (404/410) is deleted so we stop retrying it.
 */
export async function notify(db: Firestore, uid: string | null | undefined, payload: PushPayload): Promise<void> {
  if (!pushConfigured || !uid) return;
  try {
    const snap = await db.collection("pushSubscriptions").where("uid", "==", uid).get();
    if (snap.empty) return;
    const body = JSON.stringify(payload);
    await Promise.all(
      snap.docs.map(async (doc) => {
        const sub = doc.data() as { endpoint: string; keys: { p256dh: string; auth: string } };
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await doc.ref.delete().catch(() => undefined);
        }
      }),
    );
  } catch {
    // Best-effort. The caller's own action has already succeeded by this point.
  }
}
