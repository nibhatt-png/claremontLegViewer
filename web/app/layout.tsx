import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Public_Sans, Zilla_Slab } from "next/font/google";
import { SearchForm } from "@/components/SearchForm";
import "./globals.css";

const display = Zilla_Slab({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-body" });
const data = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-data" });

export const metadata: Metadata = {
  title: { default: "Claremont Legislation Explorer", template: "%s · Claremont Legislation Explorer" },
  description: "Claremont, CA City Council and commission agendas in plain English.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2c5a43" },
    { media: "(prefers-color-scheme: dark)", color: "#1f3a2c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${data.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site">
          <div className="wrap">
            <Link className="brand" href="/">
              Claremont Legislation Explorer
              <small>City Council and commission agendas in plain English</small>
            </Link>
            <SearchForm id="header-q" />
          </div>
        </header>
        <main id="main" className="wrap">{children}</main>
        <footer>
          <div className="wrap">
            Unofficial. Data from the City of Claremont&apos;s{" "}
            <a href="https://claremontca.legistar.com/Calendar.aspx" target="_blank" rel="noopener">Legistar</a>{" "}
            system. Always check the original documents.
          </div>
        </footer>
      </body>
    </html>
  );
}
