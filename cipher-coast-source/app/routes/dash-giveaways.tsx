import { Form } from "react-router";
import type { Route } from "./+types/dash-giveaways";
import { runAction } from "~/lib/actions.server";
import { hasRank, portal, requireStaff } from "~/lib/server";
import { Card, Empty, Message, PageHeader, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Giveaways - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const store = portal(context);
  const [giveaways, config] = await Promise.all([store.listGiveaways(user.id), store.getConfig()]);
  return { user, giveaways, config, canManage: hasRank(user.rank, "moderator") };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function Giveaways({ loaderData, actionData }: Route.ComponentProps) {
  const { giveaways, canManage, config } = loaderData;
  return (
    <>
      <PageHeader title="Giveaways" subtitle="Prize, duration, winner count, automatic draws and rerolls - all stored persistently." />
      {actionData ? <Message data={actionData} /> : null}

      {canManage ? (
        <Card title="Create a giveaway" description="Winners are drawn automatically when the timer ends or when you end it manually.">
          <Form method="post" className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="intent" value="giveaway_create" />
            <input name="prize" required placeholder="Prize" className={inputClass} />
            <input name="channel" defaultValue="#ccrp-giveaways" className={inputClass} />
            <input name="minutes" type="number" min={1} defaultValue={60} placeholder="Duration in minutes" className={inputClass} />
            <input name="winners" type="number" min={1} defaultValue={1} placeholder="Winner count" className={inputClass} />
            <textarea name="description" rows={2} placeholder="Description" className={inputClass + " sm:col-span-2"} />
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 sm:col-span-2">Create giveaway</button>
          </Form>
        </Card>
      ) : null}

      {giveaways.length === 0 ? (
        <Empty>No giveaways yet.</Empty>
      ) : (
        <div className="space-y-3">
          {giveaways.map((giveaway: any) => (
            <Card key={giveaway.id} title={giveaway.prize} description={(giveaway.description || "No description") + " | hosted by " + giveaway.hostName + " in " + giveaway.channel}>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs">{giveaway.status}</span>
                <span className="text-xs">{giveaway.entries} entries</span>
                <span className="text-xs">{giveaway.winnerCount} winner(s)</span>
                <span className="text-xs">ends {new Date(giveaway.endsAt).toLocaleString()}</span>
                {giveaway.rerolls ? <span className="text-xs">rerolled {giveaway.rerolls}x</span> : null}
              </div>
              {giveaway.status === "ended" ? (
                <p className="mt-3 text-sm text-white/70">Winners: {JSON.parse(giveaway.winners || "[]").join(", ") || "no entries"}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {giveaway.status === "active" ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="giveaway_enter" />
                    <input type="hidden" name="giveawayId" value={giveaway.id} />
                    <button disabled={Boolean(giveaway.entered)} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-40">
                      {giveaway.entered ? "Entered" : "Enter"}
                    </button>
                  </Form>
                ) : null}
                {canManage && giveaway.status === "active" ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="giveaway_end" />
                    <input type="hidden" name="giveawayId" value={giveaway.id} />
                    <button className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">End now</button>
                  </Form>
                ) : null}
                {canManage && giveaway.status === "ended" ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="giveaway_reroll" />
                    <input type="hidden" name="giveawayId" value={giveaway.id} />
                    <button className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">Reroll winners</button>
                  </Form>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-white/40">Entries are tied to signed-in accounts, so nobody can enter twice.</p>
    </>
  );
}
