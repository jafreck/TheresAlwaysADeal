import { create } from "zustand";

type ConsentStatus = "granted" | "declined" | "pending";

const STORAGE_KEY = "cookie-consent";

function readStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") return "pending";
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "granted" || value === "declined") return value;
  return "pending";
}

interface ConsentState {
  consentStatus: ConsentStatus;
  acceptConsent: () => void;
  declineConsent: () => void;
}

export const useConsent = create<ConsentState>((set) => ({
  consentStatus: readStoredConsent(),
  acceptConsent: () => {
    localStorage.setItem(STORAGE_KEY, "granted");
    set({ consentStatus: "granted" });
  },
  declineConsent: () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    set({ consentStatus: "declined" });
  },
}));

export function getConsentStatus(): ConsentStatus {
  return useConsent.getState().consentStatus;
}
