import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src="/images/logo.png"
        alt="LaundryPadi"
        width={1000}
        height={232}
        priority={priority}
        className="h-9 w-auto sm:h-10"
      />
    </Link>
  );
}
