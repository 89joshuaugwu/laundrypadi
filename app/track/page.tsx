import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackForm } from "@/components/TrackForm";

export const metadata: Metadata = {
  title: "Track your laundry order",
  description: "Check the latest status of your laundry with your order reference and phone number. No account needed.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <div className="bg-canvas">
      <Suspense
        fallback={
          <div className="container-page py-12">
            <div className="card h-[420px] p-7">
              <div className="skeleton h-8 w-56" />
            </div>
          </div>
        }
      >
        <TrackForm />
      </Suspense>
    </div>
  );
}
