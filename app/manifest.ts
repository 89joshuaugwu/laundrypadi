import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Lets people "Add to Home Screen". On iOS 16.4+, that step is also what makes push notifications possible. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LaundryPadi",
    short_name: "LaundryPadi",
    description: site.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8F5",
    theme_color: "#087F6D",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
