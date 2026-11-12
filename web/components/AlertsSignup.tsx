"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/app/alerts/actions";

/** One-field sign-up for the weekly email. Topics can be picked on the full alerts page. */
export function AlertsSignup({ id, dark = false }: { id: string; dark?: boolean }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, { status: "idle", message: "" });
  return (
    <form className="inline-form" action={action}>
      <input type="hidden" name="weekly" value="on" />
      <label htmlFor={id} className="visually-hidden">Email address</label>
      <input id={id} name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <input className="visually-hidden" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className={`button${dark ? " dark" : ""}`} type="submit" disabled={pending}>
        {pending ? "Sending…" : "Sign me up"}
      </button>
      {state.status !== "idle" && <p className="msg" role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </form>
  );
}
