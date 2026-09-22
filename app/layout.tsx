import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "@fontsource-variable/figtree/wght.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  verification: {
    google: "F3WW92_FNlQviz77sKTnTL-EnbLbWuh0P1snZC5e72o",
  },
  title: {
    default: "LaundryPadi | Book and track your laundry in Enugu",
    template: "%s | LaundryPadi",
  },
  description:
    "Find a trusted laundry near you, book in minutes and track your order without an account. LaundryPadi also gives Nigerian laundry shops simple tools to manage orders, customers and payments.",
  applicationName: "LaundryPadi",
  openGraph: {
    type: "website",
    siteName: "LaundryPadi",
    locale: "en_NG",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087F6D",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NG">
      <head>
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only z-[60] rounded bg-primary px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
