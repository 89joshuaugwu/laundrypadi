import type { Metadata } from "next";
import { AuthForms } from "@/components/AuthForms";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your LaundryPadi account to see your orders or manage your laundry shop.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <AuthForms initial="login" />;
}
