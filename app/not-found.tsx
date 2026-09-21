import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-canvas">
      <div className="container-page flex flex-col items-center py-20 text-center sm:py-28">
        <Image src="/images/logo-mark.png" alt="" width={72} height={65} className="animate-drift" />
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl">We couldn&rsquo;t find that page</h1>
        <p className="mt-4 max-w-md text-lg text-ink-soft">
          The link may be old or mistyped. Head back home, or check on an order.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">Go to home</Link>
          <Link href="/track" className="btn btn-outline">Track my order</Link>
        </div>
      </div>
    </div>
  );
}
