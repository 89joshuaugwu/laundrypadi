import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src="/images/logo.png"
        alt="LaundryPadi"
        width={800}
        height={137}
        priority={priority}
        className="h-7 w-auto sm:h-8"
      />
    </Link>
  );
}
