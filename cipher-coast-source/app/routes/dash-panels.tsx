import { useState } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/dash-panels";
import { runAction } from "~/lib/actions.server";
import { requireRank, portal } from "~/lib/server";
import { PanelPreview, type PanelShape } from "~/components/panel-preview";
import { Card, Message, Notice, PageHeader, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Panel Builder - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireRank(context, request, "owner");
  const embeds = await portal(context).listEmbeds();
  return { user, embeds };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireRank(context, request, "owner");
  return runAction(context, request, user);
}

export default function Panels({ loaderData, actionData }: Route.ComponentProps) {
  const { embeds } = loaderData;
  const [key, setKey] = useState<string>(embeds.length ? String(embeds[0].key) : "verification");
  const current = embeds.find((entry: any) => entry.key === key);
  const [panel, setPanel] = useState<PanelShape>((current?.panel ?? embeds[0]?.panel) as PanelShape);
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();

  function selectPanel(nextKey: string) {
    const found = embeds.find((entry: any) => entry.key === nextKey);
    setKey(nextKey);
    if (found) setPanel(found.panel as PanelShape);
  }

  function update<K extends keyof PanelShape>(field: K, value: PanelShape[K]) {
    setPanel((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <>
      <PageHeader title="Panel builder" subtitle="Every panel is editable without touching source code: banners, title, colour, fields, footer and buttons." />
      {actionData ? <Message data={actionData} /> : null}
      {fetcher.data?.ok ? <Notice tone="success">Panel saved and published to the live site.</Notice> : null}
      {fetcher.data?.error ? <Notice tone="error">{fetcher.data.error}</Notice> : null}

      <div className="flex flex-wrap gap-2">
        {embeds.map((entry: any) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => selectPanel(String(entry.key))}
            className={"rounded-lg px-3 py-2 text-sm transition " + (entry.key === key ? "bg-white text-black" : "border border-white/15 text-white/75 hover:bg-white/10")}
          >
            {entry.key}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Configuration" description="Changes apply after saving. Colour accepts a hex value.">
          <div className="space-y-3">
            <input value={panel.title} onChange={(event) => update("title", event.target.value)} placeholder="Title" className={inputClass} />
            <textarea value={panel.description} onChange={(event) => update("description", event.target.value)} rows={4} placeholder="Description" className={inputClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={panel.color} onChange={(event) => update("color", event.target.value)} placeholder="#0b1220" className={inputClass} />
              <input value={panel.footer} onChange={(event) => update("footer", event.target.value)} placeholder="Footer" className={inputClass} />
              <input value={panel.bannerTop} onChange={(event) => update("bannerTop", event.target.value)} placeholder="Top banner image URL" className={inputClass} />
              <input value={panel.bannerBottom} onChange={(event) => update("bannerBottom", event.target.value)} placeholder="Bottom banner image URL" className={inputClass} />
              <input value={panel.thumbnail} onChange={(event) => update("thumbnail", event.target.value)} placeholder="Thumbnail URL" className={inputClass} />
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={panel.showTimestamp} onChange={(event) => update("showTimestamp", event.target.checked)} className="size-4" />
                Show timestamp
              </label>
            </div>

            <div>
              <p className="mb-1 text-xs tracking-wide text-white/55 uppercase">Fields (JSON array)</p>
              <textarea
                rows={4}
                value={JSON.stringify(panel.fields, null, 0)}
                onChange={(event) => {
                  try {
                    update("fields", JSON.parse(event.target.value));
                  } catch {
                    // keep the last valid value while the editor text is incomplete
                  }
                }}
                className={inputClass}
              />
            </div>

            <div>
              <p className="mb-1 text-xs tracking-wide text-white/55 uppercase">Buttons (JSON array)</p>
              <textarea
                rows={3}
                value={JSON.stringify(panel.buttons, null, 0)}
                onChange={(event) => {
                  try {
                    update("buttons", JSON.parse(event.target.value));
                  } catch {
                    // keep the last valid value while the editor text is incomplete
                  }
                }}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-white/40">Styles: primary, secondary, success, danger, link.</p>
            </div>

            <fetcher.Form
              method="post"
              onSubmit={(event) => {
                const form = event.currentTarget;
                const input = form.querySelector("input[name=panel]") as HTMLInputElement | null;
                if (input) input.value = JSON.stringify(panel);
              }}
            >
              <input type="hidden" name="intent" value="embed_save" />
              <input type="hidden" name="key" value={key} />
              <input type="hidden" name="panel" value={JSON.stringify(panel)} />
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Save panel</button>
            </fetcher.Form>
          </div>
        </Card>

        <Card title="Live preview" description="Exactly how the panel renders on the site.">
          <PanelPreview panel={panel} />
        </Card>
      </div>
    </>
  );
}
