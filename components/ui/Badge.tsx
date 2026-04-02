interface BadgeProps {
  status: "tilgjengelig" | "opptatt" | "på_service" | "ute_av_drift" | "sendt" | "godkjent" | "avslått";
  className?: string;
}

const statusConfig: Record<BadgeProps["status"], { label: string; classes: string }> = {
  tilgjengelig: { label: "Tilgjengelig", classes: "bg-green-100 text-green-800" },
  opptatt: { label: "Opptatt", classes: "bg-yellow-100 text-yellow-800" },
  på_service: { label: "På service", classes: "bg-blue-100 text-blue-800" },
  ute_av_drift: { label: "Ute av drift", classes: "bg-red-100 text-red-800" },
  sendt: { label: "Sendt", classes: "bg-gray-100 text-gray-700" },
  godkjent: { label: "Godkjent", classes: "bg-green-100 text-green-800" },
  avslått: { label: "Avslått", classes: "bg-red-100 text-red-800" },
};

export function Badge({ status, className = "" }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
}
