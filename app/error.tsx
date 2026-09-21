"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="bg-canvas">
      <div className="container-page flex flex-col items-center py-20 text-center sm:py-28">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Something went wrong</h1>
        <p className="mt-4 max-w-md text-lg text-ink-soft">
          That did not load properly. Try again, and if it keeps happening, come back in a few minutes.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-outline">Go to home</Link>
        </div>
      </div>
    </div>
  );
}
