import { useEffect, useMemo, useRef, useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/apply";
import { APPLICATION_QUESTIONS, APPLICATION_STEPS, TYPING_NOTICE } from "~/lib/application-questions";
import { runAction } from "~/lib/actions.server";
import { portal, requireUser } from "~/lib/server";
import { Notice, PageHeader, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Staff Application - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireUser(context, request);
  const store = portal(context);
  const [mine, config] = await Promise.all([store.myApplication(user.id), store.getConfig()]);
  const url = new URL(request.url);
  return { user, mine, config, submitted: url.searchParams.get("submitted") };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireUser(context, request);
  const result = await runAction(context, request, user);
  if (result.ok) throw redirect("/apply?submitted=" + result.id);
  return result;
}

export default function Apply({ loaderData, actionData }: Route.ComponentProps) {
  const storageKey = "ccrp-application-" + loaderData.user.id;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [traces, setTraces] = useState<Record<string, TypedTrace>>({});
  const [step, setStep] = useState(0);
  const [ack, setAck] = useState(false);
  const [restored, setRestored] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.answers) setAnswers(parsed.answers);
        if (parsed && parsed.traces) setTraces(parsed.traces);
        if (typeof parsed?.step === "number") setStep(parsed.step);
        if (parsed?.ack) setAck(Boolean(parsed.ack));
        setRestored(true);
      }
    } catch {
      // a corrupt local draft must never block the application
    }
  }, [storageKey]);

  useEffect(() => {
    const payload = JSON.stringify({ answers, traces, step, ack });
    try {
      window.localStorage.setItem(storageKey, payload);
    } catch {
      // storage may be unavailable in private mode; answers still post with the form
    }
  }, [answers, traces, step, ack, storageKey]);

  const questions = useMemo(() => APPLICATION_QUESTIONS.filter((q) => q.step === step), [step]);
  const stepMeta = APPLICATION_STEPS[step];
  const answered = APPLICATION_QUESTIONS.filter((q) => (answers[q.id] || "").trim().length > 0).length;
  const progress = Math.round((answered / APPLICATION_QUESTIONS.length) * 100);
  const missing = questions.filter((q) => (answers[q.id] || "").trim().length === 0);

  function record(id: string, value: string, kind: "key" | "paste") {
    setTraces((previous) => {
      const trace = previous[id] ?? { events: [], keystrokes: 0, pastes: 0, firstKeyDelayMs: null };
      const elapsed = Date.now() - startedAt.current;
      const events = trace.events.slice();
      if (events.length === 0 || events.length < 1200) events.push({ t: elapsed, v: value });
      else events[events.length - 1] = { t: elapsed, v: value };
      return {
        ...previous,
        [id]: {
          events,
          keystrokes: trace.keystrokes + (kind === "key" ? 1 : 0),
          pastes: trace.pastes + (kind === "paste" ? 1 : 0),
          firstKeyDelayMs: trace.firstKeyDelayMs === null ? elapsed : trace.firstKeyDelayMs,
          durationMs: elapsed,
        },
      };
    });
  }

  const typingPayload = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const question of APPLICATION_QUESTIONS) {
      const trace = traces[question.id];
      out[question.id] = trace ? { ...trace, durationMs: trace.events.length ? trace.events[trace.events.length - 1].t : 0 } : { events: [], keystrokes: 0, pastes: 0, firstKeyDelayMs: null, durationMs: 0 };
    }
    return JSON.stringify(out);
  }, [traces]);

  const submitted = loaderData.submitted;
  const pending = loaderData.mine && loaderData.mine.status === "pending";

  return (
    <div className="min-h-svh bg-black text-white">
      <div className="mx-auto max-w-4xl px-5 py-12">
        <PageHeader
          title="Cipher Coast Staff Application"
          subtitle="Answer every question honestly. Your draft is saved in this browser between steps."
          action={<Link to="/dashboard" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10">Dashboard</Link>}
        />

        {submitted ? (
          <div className="mt-6">
            <Notice tone="success">Application #{submitted} submitted. Reviewers can now read and replay your answers. You will be notified of the decision.</Notice>
          </div>
        ) : null}

        {actionData && actionData.ok === false ? (
          <div className="mt-6"><Notice tone="error">{String(actionData.error)}</Notice></div>
        ) : null}

        <div className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          <strong className="font-semibold">Typing tracking notice.</strong> {TYPING_NOTICE}
        </div>

        {pending ? (
          <div className="mt-6">
            <Notice tone="warn">Application #{String(loaderData.mine?.id)} is already under review. You cannot submit a second application until a decision is made.</Notice>
          </div>
        ) : null}

        <div className="mt-8">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Step {step + 1} of {APPLICATION_STEPS.length}: {stepMeta.title}</span>
            <span>{answered} of {APPLICATION_QUESTIONS.length} answered</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-white transition-all" style={{ width: progress + "%" }} />
          </div>
        </div>

        <Form method="post" className="mt-8 space-y-6" onSubmit={(event) => { if (!ack) event.preventDefault(); }}>
          <input type="hidden" name="intent" value="application_submit" />
          <input type="hidden" name="answers" value={JSON.stringify(answers)} />
          <input type="hidden" name="typing" value={typingPayload} />
          <input type="hidden" name="acknowledgment" value={ack ? "yes" : "no"} />

          <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm text-white/60">{stepMeta.blurb}</p>
            {questions.map((question) => (
              <label key={question.id} className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/85">{question.prompt}</span>
                {question.long ? (
                  <textarea
                    rows={4}
                    value={answers[question.id] ?? ""}
                    onChange={(event) => { setAnswers((previous) => ({ ...previous, [question.id]: event.target.value })); }}
                    onKeyDown={() => record(question.id, answers[question.id] ?? "", "key")}
                    onPaste={() => record(question.id, answers[question.id] ?? "", "paste")}
                    className={inputClass}
                  />
                ) : (
                  <input
                    value={answers[question.id] ?? ""}
                    onChange={(event) => { setAnswers((previous) => ({ ...previous, [question.id]: event.target.value })); }}
                    onKeyDown={() => record(question.id, answers[question.id] ?? "", "key")}
                    onPaste={() => record(question.id, answers[question.id] ?? "", "paste")}
                    className={inputClass}
                  />
                )}
              </label>
            ))}

            {step === APPLICATION_STEPS.length - 1 ? (
              <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-black/40 p-4 text-sm text-white/75">
                <input type="checkbox" checked={ack} onChange={(event) => setAck(event.target.checked)} className="mt-0.5 size-4" />
                <span>I understand that my typing is tracked for review, and I confirm the answers above are my own work.</span>
              </label>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-40">
                Back
              </button>
              {step < APPLICATION_STEPS.length - 1 ? (
                <button type="button" onClick={() => setStep((value) => Math.min(APPLICATION_STEPS.length - 1, value + 1))} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">
                  Next step
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {missing.length > 0 ? <span className="text-xs text-white/45">Answer all questions on this step ({missing.length} left)</span> : null}
              {step === APPLICATION_STEPS.length - 1 ? (
                <button type="submit" disabled={submitting || !ack} className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/85 disabled:opacity-40">
                  {submitting ? "Submitting..." : "Submit application"}
                </button>
              ) : null}
            </div>
          </div>
        </Form>

        {restored ? <p className="mt-6 text-xs text-white/35">A saved draft was restored from this browser.</p> : null}
      </div>
    </div>
  );
}

interface TypedTrace {
  events: { t: number; v: string }[];
  keystrokes: number;
  pastes: number;
  firstKeyDelayMs: number | null;
  durationMs?: number;
}
