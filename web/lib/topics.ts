/**
 * Topics are assigned by matching keywords in an item's official title and one-line summary.
 * An item can belong to several topics. Minutes are left out: they never say what was decided.
 */
import topicData from "./topics.json";

export type Topic = {
  slug: string;
  name: string;
  blurb: string;
  short: string;  // tile subtitle
  color: string;  // tile and accent color; white text on it passes contrast
  soft: string;   // pale tint of color, for chips
  match: RegExp;
};

// topics.json is shared with the email alerts (pipeline/alerts.py), so keep patterns to regex syntax
// that JavaScript and Python read the same way. Streets doesn't match plain "street" or "boulevard":
// those match addresses in permit and Mills Act titles.
export const TOPICS: Topic[] = topicData.map((t) => ({
  slug: t.slug,
  name: t.name,
  blurb: t.blurb,
  short: t.short,
  color: t.color,
  soft: t.soft,
  match: new RegExp(t.pattern, "i"),
}));

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function isMinutes(title: string): boolean {
  return /\bminutes\b/i.test(title);
}

export function topicsFor(title: string, oneLine?: string | null): Topic[] {
  if (isMinutes(title)) return [];
  // Titles often end "(FUNDING SOURCE: GENERAL FUND)", which says how it's paid for, not what it's about.
  const text = `${title.replace(/\(\s*FUNDING SOURCES?:[^)]*\)?/gi, "")} ${oneLine ?? ""}`;
  return TOPICS.filter((t) => t.match.test(text));
}

/** The topic a meeting body mostly deals with, for its color and label. City Council covers everything. */
const BODY_TOPICS: [RegExp, string][] = [
  [/tree committee/i, "parks"],
  [/architectural and preservation/i, "history"],
  [/community and human services/i, "community"],
  [/planning/i, "development"],
  [/police/i, "safety"],
  [/sustainability/i, "environment"],
  [/traffic and transportation/i, "streets"],
  [/council/i, "government"],
];

export function topicForBody(bodyName: string): Topic | undefined {
  const slug = BODY_TOPICS.find(([re]) => re.test(bodyName))?.[1];
  return slug ? topicBySlug(slug) : undefined;
}
