"use client";

import { Lock, Search, ShieldAlert, Store, Unlock, User as UserIcon, Users as UsersIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, EmptyState, Modal, PageSkeleton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/site";

interface AdminUser {
  uid: string; email: string; name: string; role: "customer" | "owner" | "unknown"; disabled: boolean; createdAt?: string;
}

const roleChip: Record<AdminUser["role"], { label: string; cls: string; Icon: typeof UserIcon }> = {
  customer: { label: "Customer", cls: "bg-[#E4EDF9] text-[#1F4B8A]", Icon: UserIcon },
  owner: { label: "Shop owner", cls: "bg-mint text-primary-dark", Icon: Store },
  unknown: { label: "No profile", cls: "bg-[#ECF0ED] text-[#42544F]", Icon: UserIcon },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  function load() {
    apiFetch<{ users: AdminUser[] }>("/api/admin/users", { method: "GET" })
      .then((res) => setUsers(res.users))
      .catch((e: Error) => setError(e.message));
  }
  useEffect(load, []);

  const term = q.trim().toLowerCase();
  const list = useMemo(
    () => (users ?? []).filter((u) => !term || u.email.toLowerCase().includes(term) || u.name.toLowerCase().includes(term)),
    [users, term],
  );

  async function toggle() {
    if (!target) return;
    setBusy(true);
    setActionError("");
    try {
      await apiFetch(`/api/admin/users/${target.uid}`, { method: "PATCH", body: { action: target.disabled ? "enable" : "disable" } });
      setTarget(null);
      load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Users</h1>

      {error ? (
        <p className="text-danger">{error}</p>
      ) : !users ? (
        <PageSkeleton />
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon aria-hidden="true" className="h-7 w-7" />} title="No users yet" />
      ) : (
        <section className="card overflow-hidden">
          <div className="relative border-b border-line p-4">
            <Search aria-hidden="true" className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <label htmlFor="user-search" className="sr-only">Search users</label>
            <input id="user-search" className="input pl-10" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {list.length === 0 ? (
            <p className="p-6 text-center text-ink-soft">No users match your search.</p>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((u) => {
                const chip = roleChip[u.role];
                return (
                  <li key={u.uid} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{u.name || u.email}</p>
                      <p className="truncate text-sm text-ink-soft">{u.email}{u.createdAt ? ` \u00B7 Joined ${formatDate(u.createdAt.slice(0, 10), true)}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${chip.cls}`}><chip.Icon aria-hidden="true" className="h-3 w-3" />{chip.label}</span>
                      {u.disabled && <span className="inline-flex items-center gap-1 rounded-full bg-[#FBE5E1] px-2.5 py-1 text-xs font-semibold text-[#8F2417]"><ShieldAlert aria-hidden="true" className="h-3 w-3" />Locked</span>}
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setActionError(""); setTarget(u); }}>
                        {u.disabled ? <><Unlock aria-hidden="true" className="h-4 w-4" />Unlock</> : <><Lock aria-hidden="true" className="h-4 w-4" />Lock</>}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title={target?.disabled ? "Unlock this account?" : "Lock this account?"}>
        {target && (
          <>
            <p className="text-ink-soft">
              {target.disabled
                ? <>{target.name || target.email} will be able to sign in again.</>
                : <>{target.name || target.email} will be signed out immediately and will not be able to sign in until you unlock the account.</>}
            </p>
            {actionError && <div className="mt-3"><Alert>{actionError}</Alert></div>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="btn btn-outline" onClick={() => setTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" aria-busy={busy} onClick={toggle}>{target.disabled ? "Unlock account" : "Lock account"}</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
