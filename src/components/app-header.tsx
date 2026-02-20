"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/book", label: "Book a pickup" },
  { href: "/account", label: "Account" },
] as const;

const linkBase =
  "text-sm font-medium transition-colors py-2 px-1 border-b-2 border-transparent";
const linkActive = "text-fern-900 font-semibold border-fern-500 cursor-default";
const linkInactive =
  "text-fern-600 hover:text-fern-900 border-transparent hover:border-fern-200";

export function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href === "/dashboard" && pathname === "/staff");

  return (
    <header className="relative border-b border-fern-200/80 bg-white shadow-sm">
      <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-lg font-semibold text-fern-900 hover:text-fern-700 transition-colors"
        >
          Doorstep Laundry
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            return isActive(href) ? (
              <span
                key={href}
                aria-current="page"
                className={`${linkBase} ${linkActive}`}
              >
                {label}
              </span>
            ) : (
              <Link
                key={href}
                href={href}
                className={`${linkBase} ${linkInactive}`}
              >
                {label}
              </Link>
            );
          })}
          <form action="/api/auth/signout" method="POST" className="inline ml-2">
            <button
              type="submit"
              className={`${linkBase} ${linkInactive}`}
            >
              Sign out
            </button>
          </form>
        </nav>

        {/* Mobile: hamburger button */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg text-fern-700 hover:bg-fern-100"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-fern-900/20 md:hidden"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            className="absolute left-0 right-0 top-full z-20 border-b border-fern-200/80 bg-white shadow-lg md:hidden"
            aria-label="Mobile menu"
          >
            <div className="mx-auto max-w-5xl px-4 py-3 flex flex-col gap-0">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-3 px-2 text-base font-medium border-b border-fern-100 last:border-0 ${
                    isActive(href) ? "text-fern-900" : "text-fern-600 hover:text-fern-900"
                  }`}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
              <form action="/api/auth/signout" method="POST" className="border-t border-fern-100 mt-1 pt-2">
                <button
                  type="submit"
                  className="w-full text-left py-3 px-2 text-base font-medium text-fern-600 hover:text-fern-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
