import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-danger",
        className,
      )}
    >
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-danger/20 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          Retry
        </button>
      )}
    </div>
  );
}
