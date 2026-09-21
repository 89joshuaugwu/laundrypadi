import type { Metadata } from "next";
import { AuthForms } from "@/components/AuthForms";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free customer account, or set up a shop account to manage your laundry business on LaundryPadi.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage({ searchParams }: { searchParams: { type?: string } }) {
  return <AuthForms initial="register" initialRole={searchParams.type === "owner" ? "owner" : "customer"} />;
}
