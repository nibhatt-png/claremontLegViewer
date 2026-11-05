import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page">
      <div>
        <h1>Page not found</h1>
        <p className="lede">That page, meeting or agenda item isn&apos;t in our records.</p>
      </div>
      <p><Link href="/">See what&apos;s happening this week</Link></p>
    </div>
  );
}
