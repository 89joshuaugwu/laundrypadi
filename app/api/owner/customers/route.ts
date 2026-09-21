import { NextResponse } from "next/server";
import { authOwner, jsonError, upsertCustomer } from "@/lib/server";
import { cleanText, isValidNgPhone } from "@/lib/validate";

export const runtime = "nodejs";

/** Add a customer, or return the existing one when the phone number is already saved for this shop. */
export async function POST(req: Request) {
  const a = await authOwner(req);
  if ("res" in a) return a.res;
  const { db, uid, shopId } = a.ctx;

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("That request could not be read.", 400);
  }
  const name = cleanText(b.name, 80);
  const phone = cleanText(b.phone, 20);
  if (name.length < 2) return jsonError("Enter the customer's name.", 400);
  if (!isValidNgPhone(phone)) return jsonError("Enter a valid Nigerian phone number, like 0803 123 4567.", 400);

  const customer = await upsertCustomer(db, { ownerId: uid, shopId, name, phone });
  return NextResponse.json({ ok: true, id: customer.id });
}
