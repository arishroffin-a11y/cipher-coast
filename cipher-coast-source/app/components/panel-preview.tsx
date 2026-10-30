import type { ReactNode } from "react";

export interface PanelShape {
  title: string;
  description: string;
  color: string;
  bannerTop: string;
  bannerBottom: string;
  thumbnail: string;
  footer: string;
  showTimestamp: boolean;
  fields: { name: string; value: string }[];
  buttons: { label: string; style: string; action: string }[];
}

export function buttonClass(style: string): string {
  if (style === "success") return "bg-emerald-100 text-emerald-950 hover:bg-white";
  if (style === "danger") return "bg-red-500/80 text-white hover:bg-red-500";
  if (style === "secondary") return "bg-white/10 text-white hover:bg-white/20";
  if (style === "link") return "bg-transparent text-white underline";
  return "bg-white text-black hover:bg-white/85";
}

export function PanelPreview({ panel, actions }: { panel: PanelShape; actions?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
      {panel.bannerTop ? <img src={panel.bannerTop} alt="" className="h-32 w-full object-cover" /> : <div className="h-1.5 w-full" style={{ background: panel.color }} />}
      <div className="flex gap-4 p-6">
        <div className="min-w-0 flex-1">
          {panel.title ? <h3 className="font-display text-lg font-semibold">{panel.title}</h3> : null}
          {panel.description ? <p className="mt-2 text-sm whitespace-pre-line text-white/75">{panel.description}</p> : null}
          {panel.fields.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {panel.fields.map((field, index) => (
                <div key={index} className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">{field.name}</p>
                  <p className="mt-1 text-sm text-white/85">{field.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {panel.thumbnail ? <img src={panel.thumbnail} alt="" className="size-16 shrink-0 rounded-lg object-cover" /> : null}
      </div>
      {panel.bannerBottom ? <img src={panel.bannerBottom} alt="" className="h-24 w-full object-cover" /> : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 p-4">
        {actions ?? panel.buttons.map((button, index) => (
          <span key={index} className={"rounded-lg px-3 py-1.5 text-sm font-medium transition " + buttonClass(button.style)}>
            {button.label}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-white/45">
        <span>{panel.footer}</span>
        {panel.showTimestamp ? <span>{new Date().toISOString().slice(0, 16).replace("T", " ")}</span> : null}
      </div>
    </div>
  );
}
