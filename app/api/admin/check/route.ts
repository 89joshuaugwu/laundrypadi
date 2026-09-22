import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/server";

export const runtime = "nodejs";

/** Lightweight gate check the admin shell calls before rendering anything. */
export async function GET(req: Request) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  return NextResponse.json({ ok: true });
}
