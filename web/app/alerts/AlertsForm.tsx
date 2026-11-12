"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "./actions";

type TopicOption = { slug: string; name: string; blurb: string; color: string; soft: string };

export function AlertsForm({ topics }: { topics: TopicOption[] }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: "idle", message: "" });

  if (state.status === "ok") {
    return (
      <div className="callout success" role="status">
        <strong>Check your inbox</strong>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="alerts-form" noValidate>
      <fieldset>
        <legend>What would you like?</legend>
        <label className="choice big">
          <input type="checkbox" name="weekly" defaultChecked />
          <span>
            <strong>The weekly email</strong>
            <span className="meta block">Every Friday: all of next week&apos;s city meetings, in plain English.</span>
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Topics to follow</legend>
        <p className="meta">We&apos;ll email you when one of these comes up on an agenda.</p>
        <div className="choices">
          {topics.map((t) => (
            <label className="choice" key={t.slug} style={{ "--topic": t.color, "--soft": t.soft } as React.CSSProperties}>
              <input type="checkbox" name="topics" value={t.slug} />
              <span>
                <strong>{t.name}</strong>
                <span className="meta block">{t.blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="email-row">
        <label htmlFor="alert-email">Your email</label>
        <div className="inline-form">
          <input id="alert-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          <button className="button" type="submit" disabled={pending}>{pending ? "Sending…" : "Sign me up"}</button>
        </div>
        {/* Hidden from people; bots that fill in every field get ignored. */}
        <input className="visually-hidden" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>

      {state.status === "error" && <p className="callout error" role="alert">{state.message}</p>}
      <p className="meta">
        We&apos;ll send one email to confirm. No ads, and we never share your address. Every email has an
        unsubscribe link.
      </p>
    </form>
  );
}
