import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "@/lib/query-provider";
import { initSentry } from "@/lib/sentry";
import Header from "@/components/Header";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

initSentry();

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  metadataBase: new URL("https://theresalwaysadeal.com"),
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
  twitter: {
    card: "summary_large_image",
    title: "There's Always a Deal",
    description: "Find the best deals across the web, automatically aggregated and curated.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "There's Always a Deal",
  description: "Find the best deals across the web, automatically aggregated and curated.",
  url: "https://theresalwaysadeal.com",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        {plausibleDomain && (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={plausibleDomain}
            strategy="afterInteractive"
            defer
          />
        )}
      </head>
      <body className="flex min-h-screen flex-col">
        <NuqsAdapter>
        <QueryProvider>
          <Header />

          {/* Ad slot placeholder */}
          <div data-slot="top-banner" className="hidden" aria-hidden="true">
            {/* Ad banner placeholder */}
          </div>

          <main className="flex-1">{children}</main>

          {/* Ad slot placeholder */}
          <div data-slot="footer-banner" className="hidden" aria-hidden="true">
            {/* Ad banner placeholder */}
          </div>

          <footer className="border-t border-zinc-800 bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 py-8">
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-zinc-300">Browse</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/deals" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Deals
                      </Link>
                    </li>
                    <li>
                      <Link href="/free-games" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Free Games
                      </Link>
                    </li>
                    <li>
                      <Link href="/stores" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Stores
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-zinc-300">About</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/about" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link href="/affiliate-disclosure" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        Affiliate Disclosure
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t border-zinc-800 pt-6">
                <p className="text-xs text-zinc-500">
                  <strong>Affiliate Disclosure:</strong> Some links on this site are affiliate links.
                  We may earn a commission at no extra cost to you when you purchase through these links.
                  This helps support the site and keeps it free to use.
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                  &copy; {new Date().getFullYear()} There&apos;s Always a Deal. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </QueryProvider>
        </NuqsAdapter>

        <CookieConsentBanner />
      </body>
    </html>
  );
}
