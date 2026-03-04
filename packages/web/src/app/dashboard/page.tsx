"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/useAuth";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-50">
        Welcome{user?.name ? `, ${user.name}` : ""}!
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        This is your dashboard. More features coming soon.
      </p>
    </div>
  );
}
