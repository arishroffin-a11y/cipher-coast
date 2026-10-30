import { Link } from "react-router";
import type { Route } from "./+types/home";
import { Reveal } from "~/components/reveal";
import { PanelPreview } from "~/components/panel-preview";
import { currentUser, portal, RANK_LABELS } from "~/lib/server";

export function meta() {
  return [
    { title: "Cipher Coast Real Roleplay" },
    { name: "description", content: "Cipher Coast Real Roleplay (CCRP) - sessions, staff team and a full staff portal with applications, moderation tools and shift tracking." },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const store = portal(context);
  const [user, verification, applicationPanel] = await Promise.all([
    currentUser(context, request),
    store.getEmbed("verification"),
    store.getEmbed("application_panel"),
  ]);
  return { user, verification, applicationPanel };
}

const departments = [
  { name: "Session Control", detail: "Vote, low and full session votes with a live voter list, announcements and three-channel lockdown." },
  { name: "Moderation", detail: "Every case is logged with the moderator, action, reason and evidence - searchable from one dashboard." },
  { name: "Staff Management", detail: "Promotions, infractions, staff requests and LOAs with audited reasons and owner-only approvals." },
  { name: "Training", detail: "Structured driving and moderation grading out of 20, with automatic totals and pass marks." },
];

const features = [
  { title: "Verification", copy: "Maths-challenge verification panel with attempt tracking, cooldowns and role grants handled server-side." },
  { title: "Applications", copy: "23-question multi-step staff application that saves progress and records typing for reviewer playback." },
  { title: "Assistance Tickets", copy: "Private tickets with claim, unclaim, rename, close reasons and transcripts posted to the log channel." },
  { title: "Shift Tracking", copy: "Clock in and out, breaks excluded from active time, and leaderboards in hours and minutes." },
  { title: "Giveaways", copy: "Prize, duration and winner count with automatic draws, rerolls and persistent entries." },
  { title: "Panel Builder", copy: "Every panel is configurable: banners, title, colour, fields, footer and button labels with live preview." },
];

const steps = [
  { step: "01", title: "Create an account", copy: "Register with a username and password, then complete verification to unlock the community side of the portal." },
  { step: "02", title: "Complete the application", copy: "Answer all 23 rule and scenario questions in the multi-step form. Progress is saved as you go." },
  { step: "03", title: "Get reviewed", copy: "Appointed reviewers watch your typing back, then accept or deny with a reason. Trial Moderator unlocks the dashboard." },
];

const faqs = [
  { q: "Do I need an account to browse?", a: "The public site is open to everyone. The dashboard, applications and tickets require a signed-in Cipher Coast account." },
  { q: "Who reviews staff applications?", a: "Owners and the application reviewers they appoint. Only those accounts can accept or deny, and every decision is logged." },
  { q: "How does the typing playback work?", a: "The application form records timing, keystrokes and pastes for each answer. Reviewers can replay the answer exactly as it was typed. You are told about this before you begin." },
  { q: "Is my application private?", a: "Yes. Applications, tickets and staff notes are only visible to the applicant, reviewers and management." },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, verification, applicationPanel } = loaderData;

  return (
    <div className="min-h-svh bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/clogo.png" alt="Cipher Coast" className="h-10 w-10 rounded-full object-contain" />
            <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase">Cipher Coast</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/65 lg:flex">
            <a className="transition hover:text-white" href="#departments">Departments</a>
            <a className="transition hover:text-white" href="#platform">Platform</a>
            <a className="transition hover:text-white" href="#join">Join the team</a>
            <a className="transition hover:text-white" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10">
                  Staff Login
                </Link>
                <Link to="/register" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">
                  Get Access
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 grain" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-[140px]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-32">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] tracking-[0.28em] text-white/60 uppercase">
                <span className="size-1.5 rounded-full bg-white pulse-soft" /> Cipher Coast Roleplay
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Real roleplay.
                <br />
                Real consequences.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
                A community built on serious sessions, a trained staff team and total transparency. Apply for the team, get verified, and run
                sessions with the tools the coast actually deserves.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/apply" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
                  Apply for Staff
                </Link>
                <Link to="/login" className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Staff Dashboard
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {[
                  { k: "23", v: "Application questions" },
                  { k: "10", v: "Rule definitions tested" },
                  { k: "3", v: "Lockdown channels" },
                  { k: "100%", v: "Audited actions" },
                ].map((item) => (
                  <div key={item.v}>
                    <dt className="font-display text-2xl font-semibold">{item.k}</dt>
                    <dd className="mt-1 text-xs text-white/45">{item.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <Reveal delay={200} className="relative">
            <img src="/clogo.png" alt="Cipher Coast Real Roleplay" className="mx-auto w-64 float-slow sm:w-80 lg:w-96" />
            <div className="mt-10">
              <PanelPreview panel={applicationPanel.panel} />
            </div>
          </Reveal>
        </div>
      </section>

      <div className="overflow-hidden border-b border-white/10 bg-white/[0.02] py-4">
        <div className="marquee-track flex w-max gap-10 text-xs tracking-[0.3em] text-white/40 uppercase">
          {Array.from({ length: 2 }).map((_, row) => (
            <div key={row} className="flex gap-10">
              {["Session Votes", "Verification", "Staff Applications", "Moderation Logs", "Shift Leaderboards", "Giveaways", "Training Results", "Audit Trail", "Tickets"].map((item) => (
                <span key={row + item}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="departments" className="mx-auto max-w-7xl px-5 py-24">
        <Reveal>
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Departments</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-4xl">Every part of the coast, covered by one portal.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {departments.map((item, index) => (
            <Reveal key={item.name} delay={index * 90}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/25 hover:bg-white/[0.05]">
                <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                <p className="mt-2 text-sm text-white/55">{item.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="platform" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <Reveal>
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">The platform</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-4xl">Built for staff, not for screenshots.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((item, index) => (
              <Reveal key={item.title} delay={index * 70}>
                <div className="h-full rounded-2xl border border-white/10 bg-black/60 p-6">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-white" />
                    <h3 className="font-display text-base font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-white/55">{item.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <PanelPreview panel={verification.panel} />
              <div className="rounded-2xl border border-white/10 bg-black/60 p-6">
                <h3 className="font-display text-lg font-semibold">Verification without loopholes</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/60">
                  {[
                    "A fresh maths question is generated for every attempt.",
                    "Correct answers grant the configured role - clients cannot grant roles themselves.",
                    "Repeated failures trigger a cooldown instead of an infinite retry loop.",
                    "Duplicate verifications are rejected; attempts are logged for review.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-white/70" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-white/40">Signed in as staff? {user ? RANK_LABELS[user.rank] ?? user.rank : "sign in to"} access the full portal.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="join" className="mx-auto max-w-7xl px-5 py-24">
        <Reveal>
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">Recruitment</p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Three steps to the team.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map((item, index) => (
            <Reveal key={item.step} delay={index * 90}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <span className="font-display text-5xl font-bold text-white/10">{item.step}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-white/55">{item.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={140}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="max-w-xl text-sm text-white/60">
              Applications are reviewed by owners and appointed reviewers only. Accepted applicants receive the Trial Moderator rank and immediate
              dashboard access.
            </p>
            <Link to="/apply" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85">
              Start your application
            </Link>
          </div>
        </Reveal>
      </section>

      <section id="faq" className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-5 py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Questions, answered.</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map((item, index) => (
              <Reveal key={item.q} delay={index * 70}>
                <details className="group rounded-xl border border-white/10 bg-black/50 p-5 transition hover:border-white/20">
                  <summary className="cursor-pointer list-none font-medium text-white/90">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-white/40 transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-white/55">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-10">
          <div className="flex items-center gap-3">
            <img src="/clogo.png" alt="Cipher Coast" className="h-10 w-10 rounded-full object-contain" />
            <div>
              <p className="font-display text-sm font-semibold tracking-[0.2em] uppercase">Cipher Coast</p>
              <p className="text-xs text-white/40">Real Roleplay</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/55">
            <Link className="transition hover:text-white" to="/login">Staff login</Link>
            <Link className="transition hover:text-white" to="/register">Register</Link>
            <Link className="transition hover:text-white" to="/apply">Apply</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
