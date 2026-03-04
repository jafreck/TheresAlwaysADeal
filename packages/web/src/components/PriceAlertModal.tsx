"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";

interface PriceAlertModalProps {
  gameId: number;
  gameTitle: string;
  className?: string;
}

interface FormValues {
  targetPrice: number;
}

export default function PriceAlertModal({
  gameId,
  gameTitle,
  className,
}: PriceAlertModalProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      await apiClient.createPriceAlert(gameId, data.targetPrice);
      setSuccess(true);
      reset();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch {
      setError("Failed to create price alert. Please try again.");
    }
  };

  const handleTriggerClick = () => {
    if (!accessToken) {
      return;
    }
    setOpen(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={handleTriggerClick}
        title={!accessToken ? "Log in to set price alerts" : undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          !accessToken && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        Set Price Alert
      </button>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">
            Set Price Alert for {gameTitle}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            We&apos;ll notify you when the price drops to your target.
          </Dialog.Description>

          {success ? (
            <p className="mt-4 text-sm text-green-600" role="status">
              Price alert created successfully!
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="targetPrice"
                  className="block text-sm font-medium"
                >
                  Target Price (USD)
                </label>
                <input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("targetPrice", {
                    required: "Target price is required",
                    valueAsNumber: true,
                    validate: (v) =>
                      v > 0 || "Price must be a positive number",
                  })}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                />
                {errors.targetPrice && (
                  <p className="mt-1 text-sm text-red-500" role="alert">
                    {errors.targetPrice.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/20"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/80 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Alert"}
                </button>
              </div>
            </form>
          )}

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
