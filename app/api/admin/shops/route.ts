import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const a = await authAdmin(req);
  if ("res" in a) return a.res;
  const { db } = a.ctx;

  const snap = await db.collection("shops").orderBy("createdAt", "desc").get();
  const shops = snap.docs.map((d) => {
    const s = d.data();
    return {
      id: d.id,
      name: s.name ?? "",
      slug: s.slug ?? "",
      area: s.area ?? "",
      phone: s.phone ?? "",
      ownerId: s.ownerId ?? "",
      accepting: s.accepting !== false,
      suspended: s.suspended === true,
      subscription: s.subscription ?? {},
      services: Array.isArray(s.services) ? s.services.length : 0,
      createdAt: s.createdAt ?? "",
    };
  });
  return NextResponse.json({ ok: true, shops });
}
