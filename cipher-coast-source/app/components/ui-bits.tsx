import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-white/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium tracking-wide text-white/50 uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "success"; children: ReactNode }) {
  const tones: Record<string, string> = {
    info: "border-white/15 bg-white/[0.04] text-white/75",
    warn: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    error: "border-red-400/30 bg-red-500/10 text-red-100",
    success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  };
  return <div className={"rounded-xl border px-4 py-3 text-sm " + tones[tone]}>{children}</div>;
}

export function Message({ data }: { data?: any }) {
  if (!data || (data.ok !== false && !data.error)) return null;
  const error = data.error || "That action could not be completed.";
  return <Notice tone="error">{String(error)}</Notice>;
}

export function Success({ data, children }: { data?: any; children?: ReactNode }) {
  if (!data || data.ok !== true) return null;
  return <Notice tone="success">{children ?? "Saved."}</Notice>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-white/50">{children}</div>;
}

export function Card({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-white/55">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium tracking-wide text-white/60 uppercase">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-white/40">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none";

export const buttonClass = "rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-50";

export const ghostButtonClass = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10";

export function RankBadge({ rank }: { rank: string }) {
  const labels: Record<string, string> = {
    member: "Member",
    trial_moderator: "Trial Mod",
    moderator: "Moderator",
    senior_moderator: "Senior Mod",
    management: "Management",
    owner: "Owner",
  };
  return <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white/70 uppercase">{labels[rank] ?? rank}</span>;
}
