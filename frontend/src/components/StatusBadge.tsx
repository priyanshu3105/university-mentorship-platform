import type { AvailabilityStatus } from "@/types/api";

interface StatusBadgeProps {
  status: AvailabilityStatus;
  size?: "sm" | "md";
}

const config: Record<AvailabilityStatus, { dot: string; text: string; bg: string; label: string }> = {
  available: {
    dot: "bg-status-available",
    text: "text-status-available",
    bg: "bg-green-50",
    label: "Available",
  },
  busy: {
    dot: "bg-status-busy",
    text: "text-status-busy",
    bg: "bg-yellow-50",
    label: "Busy",
  },
  offline: {
    dot: "bg-status-offline",
    text: "text-status-offline",
    bg: "bg-secondary",
    label: "Offline",
  },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { dot, text, bg, label } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${bg} ${
        size === "sm" ? "text-xs" : "text-xs"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className={`font-medium ${text}`}>{label}</span>
    </span>
  );
}
