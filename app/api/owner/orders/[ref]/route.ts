import { NextResponse } from "next/server";
import { METHOD_LABEL, type PaymentMethod } from "@/lib/models";
import { authOwner, jsonError, newId } from "@/lib/server";
import { notify } from "@/lib/push";
import { formatNaira, todayLagos } from "@/lib/site";
import { ORDER_STEPS, type OrderStatus } from "@/lib/types";
import { cleanText, isIsoDate, normalizeRef, toInt } from "@/lib/validate";

export const runtime = "nodejs";

type Result = { error: string; status: number } | { ok: true; notify?: { customerUid: string | null; title: string; body: string; url: string } };

/** Change status, record a payment, or edit the collection date / notes. Runs in a transaction so two taps never double-count. */
export async function PATCH(req: Request, { params }: { params: { ref: string } }) {
  const a = await authOwner(req);
  if ("res" in a) return a.res;
  const { db, uid } = a.ctx;

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }
  const ref = normalizeRef(params.ref);
  const docRef = db.collection("orders").doc(ref);

  const result: Result = await db.runTransaction(async (tx): Promise<Result> => {
    const snap = await tx.get(docRef);
    const o = snap.data();
    if (!snap.exists || !o || o.ownerId !== uid) return { error: "Order not found.", status: 404 };

    const now = new Date().toISOString();
    const activity = [...((o.activity as { at: string; text: string }[]) ?? [])];

    if (b.action === "status") {
      const status = ORDER_STEPS.find((s) => s.status === b.status);
      if (!status) return { error: "Choose a valid status.", status: 400 };
      const idx = ORDER_STEPS.findIndex((s) => s.status === status.status);
      const timeline: Partial<Record<OrderStatus, string>> = { ...(o.timeline ?? {}) };
      ORDER_STEPS.forEach((s, i) => {
        if (i > idx) delete timeline[s.status];
        else if (!timeline[s.status]) timeline[s.status] = todayLagos();
      });
      activity.push({ at: now, text: `Marked as ${status.label}` });
      tx.update(docRef, { status: status.status, timeline, activity, updatedAt: now });
      const messages: Partial<Record<string, string>> = {
        washing: "is now being washed.",
        ready: "is ready for collection!",
        collected: "has been marked collected. Thank you!",
      };
      const body = messages[status.status];
      return {
        ok: true,
        ...(body ? { notify: { customerUid: (o.customerUid as string | null) ?? null, title: `Order ${ref}`, body: `${o.shopName ? `${o.shopName}: ` : ""}Your order ${body}`, url: `/account/orders/${ref}` } } : {}),
      };
    }

    if (b.action === "payment") {
      const balance = Math.max(0, Number(o.total) - Number(o.paid));
      const amount = toInt(b.amount, 1, 100_000_000);
      const method: PaymentMethod = b.method === "transfer" ? "transfer" : "cash";
      if (amount === null) return { error: "Enter the amount received.", status: 400 };
      if (amount > balance) return { error: `That is more than the balance of ${formatNaira(balance)}.`, status: 400 };
      const payments = [...((o.payments as unknown[]) ?? []), { id: newId(), amount, method, at: now }];
      activity.push({ at: now, text: `Payment of ${formatNaira(amount)} recorded (${METHOD_LABEL[method]})` });
      tx.update(docRef, { payments, paid: Number(o.paid) + amount, activity, updatedAt: now });
      return { ok: true };
    }

    if (b.action === "update") {
      const patch: Record<string, unknown> = { updatedAt: now };
      if ("collectionDate" in b) {
        const d = cleanText(b.collectionDate, 10);
        if (!isIsoDate(d)) return { error: "Choose a valid collection date.", status: 400 };
        patch.collectionDate = d;
        activity.push({ at: now, text: "Collection date changed" });
      }
      if ("notes" in b) patch.notes = cleanText(b.notes, 500, true);
      tx.update(docRef, { ...patch, activity });
      return { ok: true };
    }

    return { error: "Unknown action.", status: 400 };
  });

  if ("error" in result) return jsonError(result.error, result.status);
  if (result.notify) await notify(db, result.notify.customerUid, result.notify);
  return NextResponse.json({ ok: true });
}
