import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Public_Sans } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const body = Public_Sans({ subsets: ["latin"], variable: "--font-body" });
const data = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-data" });

export const metadata: Metadata = {
  title: { default: "Claremont Explained", template: "%s · Claremont Explained" },
  description: "Claremont's city meetings, explained in plain English. See what's being decided, what it costs, and how to have your say.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151b18" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${data.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer>
          <div className="wrap footer-inner">
            <p>
              <strong>Claremont Explained</strong> is unofficial. Summaries are written by AI from the City of
              Claremont&apos;s{" "}
              <a href="https://claremontca.legistar.com/Calendar.aspx" target="_blank" rel="noopener">Legistar</a>{" "}
              records. Always check the original documents.
            </p>
            <p>
              <Link href="/how-it-works">How it works</Link> · <Link href="/have-your-say">Have your say</Link> ·{" "}
              <Link href="/topics">Topics</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
