import { unsubscribe } from "@/app/alerts/actions";

// One-click unsubscribe (RFC 8058): Gmail and Apple Mail POST here from their own "Unsubscribe"
// button, using the List-Unsubscribe header that pipeline/alerts.py puts on every email.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  await unsubscribe(token);
  return new Response(null, { status: 204 });
}
