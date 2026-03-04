"use client";

import { useState } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";

const navLinks = [
  { href: "/deals", label: "Deals" },
  { href: "/free-games", label: "Free Games" },
  { href: "/stores", label: "Stores" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          There&apos;s Always a Deal
        </Link>

        {/* Search bar */}
        <div className="hidden flex-1 md:block md:max-w-md">
          <SearchBar />
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth CTA placeholder */}
        <div className="hidden md:block">
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sign In
          </button>
        </div>

        {/* Hamburger menu button (mobile) */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="border-t border-zinc-800 md:hidden" aria-label="Mobile navigation">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {/* Mobile search */}
            <div className="pb-2">
              <SearchBar />
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <button
              type="button"
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Sign In
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
