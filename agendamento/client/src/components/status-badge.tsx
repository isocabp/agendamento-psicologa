import { cn } from "@/lib/utils";

type Status = "em_analise" | "agendado" | "recusado" | "cancelado";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const config: Record<Status, { label: string; className: string }> = {
  em_analise: {
    label: "Em Análise",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  agendado: {
    label: "Confirmado",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  recusado: {
    label: "Recusado",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: styles } = config[status];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      styles,
      className
    )}>
      {label}
    </span>
  );
}
