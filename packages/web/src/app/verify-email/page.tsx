"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><LoadingSpinner size={32} /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    token ? "" : "Missing verification token.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        await apiClient.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (!cancelled) setStatus("success");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          const body = err.body as { message?: string } | null;
          setErrorMessage(body?.message ?? "Verification failed. The token may be invalid or expired.");
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        {status === "loading" && (
          <div role="status" aria-label="Verifying email">
            <LoadingSpinner size={32} className="mx-auto mb-4" />
            <p className="text-sm text-zinc-400">Verifying your email…</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <h1 className="mb-4 text-2xl font-bold text-zinc-50">Email Verified</h1>
            <p className="mb-6 text-sm text-zinc-400">
              Your email has been verified successfully.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <h1 className="mb-4 text-2xl font-bold text-zinc-50">Verification Failed</h1>
            <p className="mb-6 text-sm text-danger" role="alert">
              {errorMessage}
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Go to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
