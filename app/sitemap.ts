import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/for-business", "/track", "/login", "/register", "/help", "/privacy", "/terms"];
  return paths.map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/for-business" ? 0.9 : 0.6,
  }));
}
