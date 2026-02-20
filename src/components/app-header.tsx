"use client";

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

  return (
    <header className="border-b border-fern-200/80 bg-white shadow-sm">
      <div className="mx-auto max-w-5xl px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-lg font-semibold text-fern-900 hover:text-fern-700 transition-colors"
        >
          Doorstep Laundry
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive =
              pathname === href ||
              (href === "/dashboard" && pathname === "/staff");
            return isActive ? (
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
      </div>
    </header>
  );
}
