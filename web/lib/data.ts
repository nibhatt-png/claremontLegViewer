import { supabase } from "./supabase";
import { addDays, todayInClaremont } from "./format";

export type NextStep = "vote" | "public_hearing" | "discussion_only" | "consent_calendar" | "other";

export type Summary = {
  one_line: string;
  summary: string;
  cost_text: string | null;
  affected_text: string | null;
  next_step: NextStep;
};

export type ItemRow = {
  id: number;
  agenda_number: string | null;
  title: string;
  section: string | null;
  sort_order: number;
  summaries: Pick<Summary, "one_line"> | null;
};

export type Meeting = {
  id: number;
  date: string;
  time_text: string | null;
  location: string | null;
  agenda_pdf_url: string | null;
  legistar_url: string | null;
  bodies: { name: string };
  event_items: ItemRow[];
};

export type Attachment = { id: number; name: string | null; url: string; text_status: string | null };

export type ItemDetail = {
  id: number;
  agenda_number: string | null;
  title: string;
  action_text: string | null;
  section: string | null;
  summaries: Summary | null;
  events: Omit<Meeting, "event_items">;
  matters: { file_number: string | null; staff_report_text: string | null; attachments: Attachment[] };
};

export type SearchResult = {
  event_item_id: number;
  event_id: number;
  event_date: string;
  body_name: string;
  agenda_number: string | null;
  title: string;
  one_line: string | null;
  snippet: string;
};

const MEETING_FIELDS = `
  id, date, time_text, location, agenda_pdf_url, legistar_url, bodies(name),
  event_items(id, agenda_number, title, section, sort_order, summaries(one_line))`;

function meetingsQuery() {
  return supabase
    .from("events")
    .select(MEETING_FIELDS)
    .not("event_items.matter_id", "is", null) // only real agenda items, not headers
    .order("date")
    .order("sort_order", { referencedTable: "event_items" });
}

function sortByTime(meetings: Meeting[]): Meeting[] {
  const minutes = (t: string | null) => {
    const m = t?.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
    if (!m) return 24 * 60;
    return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
  };
  return [...meetings].sort((a, b) => a.date.localeCompare(b.date) || minutes(a.time_text) - minutes(b.time_text));
}

/** Meetings from today through the next 7 days; if there are none, the next one scheduled. */
export async function getThisWeek(): Promise<{ meetings: Meeting[]; fallback: boolean }> {
  const today = todayInClaremont();
  const { data, error } = await meetingsQuery().gte("date", today).lte("date", addDays(today, 6));
  if (error) throw error;
  if (data.length) return { meetings: sortByTime(data as unknown as Meeting[]), fallback: false };

  const next = await meetingsQuery().gte("date", today).limit(1);
  if (next.error) throw next.error;
  return { meetings: next.data as unknown as Meeting[], fallback: true };
}

export async function getMeeting(id: number): Promise<Meeting | null> {
  const { data, error } = await meetingsQuery().eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as Meeting | null;
}

export async function getItem(id: number): Promise<ItemDetail | null> {
  const { data, error } = await supabase
    .from("event_items")
    .select(`
      id, agenda_number, title, action_text, section,
      summaries(one_line, summary, cost_text, affected_text, next_step),
      events(id, date, time_text, location, agenda_pdf_url, legistar_url, bodies(name)),
      matters(file_number, staff_report_text, attachments(id, name, url, text_status))`)
    .eq("id", id)
    .not("matter_id", "is", null)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ItemDetail | null;
}

export async function search(q: string): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc("search_items", { q, max_results: 30 });
  if (error) throw error;
  return data as SearchResult[];
}
