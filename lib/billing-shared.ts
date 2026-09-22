/** Client-safe billing helpers (no server imports). */

/** When true, a shop's public page only takes booking requests while its plan is paid and active. */
export const BILLING_ENFORCED = process.env.NEXT_PUBLIC_BILLING_ENFORCED === "true";

export function billingOk(sub: { setupPaid?: unknown; status?: unknown } | null | undefined): boolean {
  return sub?.setupPaid === true && sub?.status === "active";
}
