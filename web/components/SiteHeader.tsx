"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "This week" },
  { href: "/topics", label: "Topics" },
  { href: "/search", label: "Search" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/have-your-say", label: "Have your say" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site">
      <div className="site-inner">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M4 20V9.5L12 4l8 5.5V20" />
              <path d="M9.5 20v-6h5v6" />
              <path d="M2.5 20h19" />
            </svg>
          </span>
          Claremont Explained
        </Link>
        <nav className="site-nav" aria-label="Main">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={isActive(pathname, n.href) ? "page" : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link className="button alerts" href="/alerts">Get email alerts</Link>
      </div>
    </header>
  );
}
