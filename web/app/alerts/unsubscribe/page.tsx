import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unsubscribe } from "../actions";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

// A button rather than unsubscribing on page load: email scanners open links, and that
// shouldn't cancel anyone's alerts.
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token = "", done } = await searchParams;

  if (done) {
    return (
      <div className="wrap page narrow">
        <h1>{done === "1" ? "You're unsubscribed" : "That link didn't work"}</h1>
        <p className="lede">
          {done === "1"
            ? "You won't get any more emails from us. Changed your mind? "
            : "We couldn't find those alerts. They may already be cancelled. "}
          <Link href="/alerts">Sign up again</Link>.
        </p>
      </div>
    );
  }

  async function confirm() {
    "use server";
    const ok = await unsubscribe(token);
    redirect(`/alerts/unsubscribe?done=${ok ? 1 : 0}`);
  }

  return (
    <div className="wrap page narrow">
      <div>
        <h1>Stop email alerts?</h1>
        <p className="lede">You&apos;ll stop getting the weekly email and all topic alerts.</p>
      </div>
      <form action={confirm}>
        <button className="button" type="submit">Unsubscribe me</button>
      </form>
    </div>
  );
}
