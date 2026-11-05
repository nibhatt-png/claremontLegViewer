/**
 * Topics are assigned by matching keywords in an item's official title and one-line summary.
 * An item can belong to several topics. Minutes are left out: they never say what was decided.
 */
export type Topic = { slug: string; name: string; blurb: string; match: RegExp };

export const TOPICS: Topic[] = [
  {
    slug: "housing",
    name: "Housing",
    blurb: "Affordable housing, rentals, short-term rentals and rental assistance.",
    match: /\b(housing|rentals?|renters?|tenants?|homeless\w*|inclusionary|affordable)\b/i,
  },
  {
    slug: "budget",
    name: "Budget and taxes",
    blurb: "The city budget, fees, rates, bonds and investments.",
    match: /\b(budget|general fund|fees?|rates?|bonds?|tax(es)?|investments?|financial|warrant registers?|proposition 218)\b/i,
  },
  {
    slug: "contracts",
    name: "Contracts and spending",
    blurb: "Agreements with companies and consultants, and purchases.",
    match: /\b(agreements?|contracts?|award|purchase|compensation|lease)\b/i,
  },
  {
    slug: "development",
    name: "Planning and development",
    blurb: "Zoning, building projects, permits and changes to land-use rules.",
    match: /\b(zoning|conditional use permit|site plan|development|buildings?|drive-through|title 16)\b/i,
  },
  {
    slug: "streets",
    name: "Streets and transportation",
    blurb: "Roads, traffic, walking, biking, transit and parking.",
    // Not plain "street" or "boulevard": those match addresses in permit and Mills Act titles.
    match: /\b(complete streets|street (improvements?|repairs?|resurfacing)|paving|traffic|transportation|sidewalks?|crosswalks?|bikes?|bicycl\w*|pedestrians?|dial-a-ride|parking)\b/i,
  },
  {
    slug: "utilities",
    name: "Sewer, water and trash",
    blurb: "Sewer, sanitation, street sweeping, water and trash service.",
    match: /\b(sewer|sanitation|trash|water|storm ?drain|street sweeping|containers?)\b/i,
  },
  {
    slug: "parks",
    name: "Parks and trees",
    blurb: "Parks, the urban forest, wilderness areas and recreation.",
    match: /\b(parks?|trees?|urban forest|wilderness|recreation|sports|basketball)\b/i,
  },
  {
    slug: "safety",
    name: "Public safety",
    blurb: "Police, fire, crime data and emergency services.",
    match: /\b(police|fire|crime|tasers?|emergency|highway patrol|alcoholic beverage control)\b/i,
  },
  {
    slug: "history",
    name: "Historic preservation",
    blurb: "Historic homes, Mills Act agreements and the local register.",
    match: /\b(mills act|historic\w*|preservation|local register)\b/i,
  },
  {
    slug: "environment",
    name: "Environment",
    blurb: "Sustainability, climate and waste reduction.",
    match: /\b(sustainability|climate|emissions|solar|recycl\w*|bear-resistant)\b/i,
  },
  {
    slug: "community",
    name: "Community services",
    blurb: "Grants, seniors, youth, and human services programs.",
    match: /\b(grants?|seniors?|aging|teens?|youth|community based organization|human services|mental health)\b/i,
  },
  {
    slug: "government",
    name: "City government",
    blurb: "Appointments, ethics rules, city staff and how commissions run.",
    match: /\b(appoint\w*|conflict of interest|chair|open meeting|director|website)\b/i,
  },
];

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
