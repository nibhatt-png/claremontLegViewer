import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1>Page not found</h1>
      <p className="lede">That meeting or agenda item isn&apos;t in our records.</p>
      <p><Link href="/">See what&apos;s happening this week</Link></p>
    </div>
  );
}
