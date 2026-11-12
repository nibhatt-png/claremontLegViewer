import type { NextStep } from "./data";

const TZ = "America/Los_Angeles";

/** Today's date in Claremont as YYYY-MM-DD. */
export function todayInClaremont(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "Tuesday, October 27" */
export function longDate(isoDate: string, withYear = false): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

/** "November 9, 2026" */
export function fullDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "Oct 27, 2026" */
export function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SMALL_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);

/** Legistar titles are all caps; make them readable. */
export function readableTitle(title: string): string {
  if (title !== title.toUpperCase()) return title;
  return title
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Agenda section headers vary ("PUBLIC HEARING" vs "PUBLIC HEARINGS"); show one label per kind. */
export function sectionLabel(section: string | null): string {
  const s = (section ?? "").toUpperCase();
  if (s.includes("CONSENT")) return "Consent calendar";
  if (s.includes("HEARING")) return "Public hearings";
  if (s.includes("ADMINISTRATIVE")) return "Administrative items";
  if (s.includes("CEREMONIAL") || s.includes("PRESENTATION")) return "Presentations";
  if (!s) return "Other items";
  const t = s.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const NEXT_STEP: Record<NextStep, { label: string; help: string }> = {
  vote: { label: "Vote", help: "The body will discuss this item and vote on it." },
  public_hearing: {
    label: "Public hearing",
    help: "Anyone can speak on this item before the body discusses it and acts.",
  },
  consent_calendar: {
    label: "Consent calendar",
    help: "A routine item approved together with others in one vote, unless someone asks to discuss it separately.",
  },
  discussion_only: { label: "Discussion only", help: "A report or presentation. No vote is planned." },
  other: { label: "Other", help: "See the agenda for details." },
};

export function locationLines(location: string | null): string[] {
  return (location ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
}

/** { dow: "Thu", day: "12", month: "November", mon: "Nov" } */
export function dateParts(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { timeZone: "UTC", ...o });
  return { dow: f({ weekday: "short" }), day: f({ day: "numeric" }), month: f({ month: "long" }), mon: f({ month: "short" }) };
}

/** "6:30 PM" -> [18, 30], or null if the time isn't stated. */
export function parseTime(text: string | null): [number, number] | null {
  const m = text?.match(/(\d{1,2}):(\d{2})\s*([AP])\.?M/i);
  if (!m) return null;
  return [(Number(m[1]) % 12) + (m[3].toUpperCase() === "P" ? 12 : 0), Number(m[2])];
}
