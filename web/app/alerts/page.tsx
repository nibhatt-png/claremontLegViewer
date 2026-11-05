import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Email alerts" };

export default function Alerts() {
  return (
    <div className="wrap page">
      <div>
        <h1>Email alerts</h1>
        <p className="lede">
          Email alerts aren&apos;t available yet. Soon you&apos;ll be able to get a weekly email with what&apos;s on
          the agenda, or a note when a topic you follow comes up.
        </p>
      </div>
      <section className="prose" aria-labelledby="meanwhile">
        <h2 id="meanwhile">In the meantime</h2>
        <ul>
          <li><Link href="/">This week</Link> lists every meeting in the next 7 days. It updates nightly.</li>
          <li><Link href="/topics">Topics</Link> groups past and upcoming items by subject.</li>
          <li>
            The City&apos;s{" "}
            <a href="https://claremontca.legistar.com/Calendar.aspx" target="_blank" rel="noopener">Legistar calendar</a>{" "}
            has the official agendas.
          </li>
        </ul>
      </section>
    </div>
  );
}
