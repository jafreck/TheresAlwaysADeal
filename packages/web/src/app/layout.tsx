import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "There's Always a Deal",
    template: "%s | There's Always a Deal",
  },
  description: "Find the best deals across the web, automatically aggregated and curated.",
  openGraph: {
    title: "There's Always a Deal",
    description: "Find the best deals across the web, automatically aggregated and curated.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
