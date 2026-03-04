import { cn } from "@/lib/utils";

interface AdSlotProps {
  slotId: string;
  className?: string;
}

export default function AdSlot({ slotId, className }: AdSlotProps) {
  return (
    <div
      data-slot={slotId}
      aria-hidden="true"
      className={cn("hidden", className)}
    />
  );
}
