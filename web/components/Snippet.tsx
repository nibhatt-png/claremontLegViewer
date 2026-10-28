/** Renders a search_items() snippet, turning its [[[match]]] markers into <mark>. React escapes the rest. */
export function Snippet({ text }: { text: string }) {
  const parts = text.replace(/\s+/g, " ").split(/(\[\[\[.*?\]\]\])/);
  return (
    <span className="snippet">
      {parts.map((part, i) =>
        part.startsWith("[[[") ? <mark key={i}>{part.slice(3, -3)}</mark> : part,
      )}
    </span>
  );
}
