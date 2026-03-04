"use client";

import { useEffect, useState } from "react";
import { useConsent } from "@/lib/consent";

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const { consentStatus, acceptConsent, declineConsent } = useConsent();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (consentStatus !== "pending") return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg p-4">
      <div className="mx-auto max-w-5xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          We use cookies to show you personalized ads. You can accept or decline
          cookie usage below.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={declineConsent}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={acceptConsent}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
