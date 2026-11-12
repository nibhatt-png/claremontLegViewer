"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const NAV = [
  { href: "/", label: "This week" },
  { href: "/topics", label: "Topics" },
  { href: "/guide", label: "Guide" },
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
          <span className="brand-mark"><Icon name="home" size={20} /></span>
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
        <Link className="button dark" href="/alerts"><Icon name="bell" size={18} />Get alerts</Link>
      </div>
    </header>
  );
}
