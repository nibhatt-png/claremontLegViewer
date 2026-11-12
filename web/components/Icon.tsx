/** Line icons from the redesign. Decorative unless given a label. */
const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12 5 5L20 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.2-6 6.5-6s6 2.5 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.5 0 4.2 2 4.5 5" /></>,
  inbox: <><path d="M3 13h5l1 3h6l1-3h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>,
  lines: <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />,
  shieldCheck: <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
  // Topics
  housing: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  budget: <><circle cx="12" cy="12" r="9" /><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11" /></>,
  contracts: <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  development: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" /></>,
  streets: <path d="M8 3 5 21M16 3l3 18M12 4v3M12 11v3M12 18v2" />,
  utilities: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  parks: <><path d="M12 21v-6" /><path d="M12 3 6 12h3l-3 4h12l-3-4h3z" /></>,
  safety: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  environment: <><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19c3-5 6-7 10-9" /></>,
  community: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.2-6 6.5-6s6 2.5 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.5 0 4.2 2 4.5 5" /></>,
  government: <path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-6 10 6z" />,
};

export function Icon({ name, size = 20, label, className, style }: {
  name: keyof typeof PATHS | string;
  size?: number;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={`ic${className ? ` ${className}` : ""}`} width={size} height={size} viewBox="0 0 24 24" style={style}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}
