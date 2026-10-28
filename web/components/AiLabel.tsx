const REPORT_EMAIL = process.env.NEXT_PUBLIC_REPORT_EMAIL;

/** Required on every page that shows summaries. */
export function AiLabel({ itemId, plural = false }: { itemId?: number; plural?: boolean }) {
  const subject = itemId ? `Error in summary for agenda item ${itemId}` : "Error in a summary";
  return (
    <p className="ai-label">
      <span>
        <strong>AI-generated summar{plural ? "ies" : "y"}.</strong> Unofficial: check the original document.
      </span>
      {REPORT_EMAIL && (
        <a href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}`}>Report an error</a>
      )}
    </p>
  );
}
