import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { MobileNav } from "./MobileNav";

export const metadata: Metadata = {
  title: {
    default: "There's Always a Deal",
    template: "%s | There's Always a Deal",
  },
  description:
    "Find the best deals across the web, automatically aggregated and curated.",
  openGraph: {
    title: "There's Always a Deal",
    description:
      "Find the best deals across the web, automatically aggregated and curated.",
    type: "website",
  },
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/deals", label: "Deals" },
  { href: "/stores", label: "Stores" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <header className="sticky top-0 z-50 border-b border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
              <a href="/" className="text-lg font-bold text-primary">
                TAAD
              </a>

              <div className="hidden flex-1 md:block">
                <input
                  type="search"
                  placeholder="Search deals..."
                  className="w-full max-w-sm rounded-md border border-muted bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <nav className="hidden items-center gap-4 md:flex">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="hidden md:block">
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign In
                </button>
              </div>

              <MobileNav links={navLinks} />
            </div>
          </header>

          <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 py-8">
            {children}
          </main>

          <footer className="border-t border-muted bg-background">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <p className="text-caption">
                Affiliate Disclosure: Some links on this site are affiliate
                links. We may earn a commission at no extra cost to you when you
                purchase through these links.
              </p>
              <p className="text-caption">
                &copy; {new Date().getFullYear()} There&apos;s Always a Deal.
                All rights reserved.
              </p>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
