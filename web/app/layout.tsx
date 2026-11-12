import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "Claremont Explained", template: "%s · Claremont Explained" },
  description: "Claremont's city meetings, explained in plain English. See what's being decided, what it costs, and how to have your say.",
};

export const viewport: Viewport = { themeColor: "#FFFFFF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer>
          <div className="wrap">
            <span>An unofficial site. Not run by the City of Claremont.</span>
            <nav aria-label="Footer">
              <Link href="/search">Search</Link>
              <Link href="/alerts">Email alerts</Link>
              <span>
                Source: the City&apos;s public{" "}
                <a href="https://claremontca.legistar.com/Calendar.aspx" target="_blank" rel="noopener">Legistar</a> system
              </span>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
