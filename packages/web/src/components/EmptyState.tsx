import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
  className?: string;
}

export default function EmptyState({
  message,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted",
        className,
      )}
    >
      {icon && <div className="text-4xl">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}
