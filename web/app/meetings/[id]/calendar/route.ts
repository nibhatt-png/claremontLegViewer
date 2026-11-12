import { getMeeting } from "@/lib/data";
import { locationLines, parseTime } from "@/lib/format";

/** An .ics file for one meeting, for "Add to calendar". Times are Claremont (Pacific) local time. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const m = Number.isInteger(id) ? await getMeeting(id) : null;
  if (!m) return new Response("Meeting not found", { status: 404 });

  const ymd = m.date.replaceAll("-", "");
  const time = parseTime(m.time_text);
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = time
    ? [`DTSTART;TZID=America/Los_Angeles:${ymd}T${pad(time[0])}${pad(time[1])}00`,
       `DTEND;TZID=America/Los_Angeles:${ymd}T${pad(Math.min(time[0] + 2, 23))}${pad(time[1])}00`]
    : [`DTSTART;VALUE=DATE:${ymd}`];
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const page = new URL(`/meetings/${m.id}`, req.url).toString();

  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Claremont Explained//EN", "BEGIN:VEVENT",
    `UID:meeting-${m.id}@claremont-explained`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    ...when,
    `SUMMARY:${esc(m.bodies.name)}`,
    `LOCATION:${esc(locationLines(m.location).join(", "))}`,
    `DESCRIPTION:${esc(`Agenda in plain English: ${page}`)}`,
    `URL:${page}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="meeting-${m.id}.ics"`,
    },
  });
}
