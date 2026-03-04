"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "@/components/AuthLayout";
import { forgotPasswordFormSchema, type ForgotPasswordFormData } from "@/lib/auth-schemas";
import { apiClient } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await apiClient.post("/api/auth/forgot-password", { email: data.email });
    } catch {
      // Intentionally swallow errors to avoid leaking account existence
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthLayout>
        <div className="text-center" role="status">
          <h1 className="mb-4 text-2xl font-bold text-zinc-50">Check Your Email</h1>
          <p className="mb-6 text-sm text-zinc-400">
            If that email is registered, you&apos;ll receive a reset link
          </p>
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="mb-2 text-center text-2xl font-bold text-zinc-50">Forgot Password</h1>
      <p className="mb-6 text-center text-sm text-zinc-400">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-danger" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {isSubmitting && <LoadingSpinner size={16} />}
          Send Reset Link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
