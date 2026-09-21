import type { OrderStatus } from "@/lib/types";

export type ChipStatus = OrderStatus | "overdue";

const styles: Record<ChipStatus, string> = {
  overdue: "bg-[#FBE5E1] text-[#8F2417]",
  received: "bg-[#E4EDF9] text-[#1F4B8A]",
  washing: "bg-[#DDEFFA] text-[#0B5680]",
  ready: "bg-[#D6F0DE] text-[#0A5F34]",
  collected: "bg-[#ECF0ED] text-[#42544F]",
};

const labels: Record<ChipStatus, string> = {
  overdue: "Overdue",
  received: "Received",
  washing: "Washing",
  ready: "Ready",
  collected: "Collected",
};

export function StatusChip({
  status,
  label,
  className = "",
}: {
  status: ChipStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${styles[status]} ${className}`}
    >
      {label ?? labels[status]}
    </span>
  );
}
