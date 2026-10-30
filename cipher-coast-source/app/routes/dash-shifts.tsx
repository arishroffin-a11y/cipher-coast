import { Form } from "react-router";
import type { Route } from "./+types/dash-shifts";
import { runAction } from "~/lib/actions.server";
import { hasRank, portal, requireStaff } from "~/lib/server";
import { Card, Empty, Message, PageHeader, Stat, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Shifts - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const store = portal(context);
  const [shift, leaderboard, online, config, edits] = await Promise.all([
    store.shiftState(user.id),
    store.shiftLeaderboard(),
    store.shiftsOnline(),
    store.getConfig(),
    hasRank(user.rank, "management") ? store.listShiftEdits(user.id).catch(() => []) : Promise.resolve([]),
  ]);
  return { user, shift, leaderboard, online, config, edits };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function Shifts({ loaderData, actionData }: Route.ComponentProps) {
  const { shift, leaderboard, online, config, user, edits } = loaderData;
  return (
    <>
      <PageHeader title="Shift management" subtitle={"Starting a shift grants " + config.shiftRole + ". Breaks are excluded from active time."} />
      {actionData ? <Message data={actionData} /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Your status" value={shift.active ? (shift.onBreak ? "On break" : "On shift") : "Off shift"} hint={shift.active ? shift.minutes + " active minutes" : "No active shift"} />
        <Stat label="Staff online" value={online.length} hint="Currently on shift" />
        <Stat label="Tracked staff" value={leaderboard.length} hint="Leaderboard entries" />
      </div>

      <Card title="Your shift" description="Duplicate active shifts are rejected.">
        <Form method="post" className="flex flex-wrap gap-2">
          {!shift.active ? (
            <button name="intent" value="shift_start" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Start shift</button>
          ) : (
            <>
              <button name="intent" value="shift_break" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                {shift.onBreak ? "End break" : "Take break"}
              </button>
              <button name="intent" value="shift_end" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">End shift</button>
            </>
          )}
        </Form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Online now" description="Staff currently on shift and their status.">
          {online.length === 0 ? (
            <Empty>Nobody is on shift.</Empty>
          ) : (
            <ul className="space-y-2">
              {online.map((entry: any) => (
                <li key={entry.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80">
                  <span>{entry.userName}</span>
                  <span className="text-xs text-white/50">{entry.onBreak ? "on break" : "online"} - {entry.minutes} min</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Leaderboard" description="Total hours and minutes of active shift time.">
          {leaderboard.length === 0 ? (
            <Empty>No shift time recorded yet.</Empty>
          ) : (
            <ol className="space-y-2">
              {leaderboard.map((entry: any, index: number) => (
                <li key={entry.userId} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80">
                  <span>#{index + 1} {entry.userName}</span>
                  <span className="text-xs text-white/50">{entry.hours}h {entry.remainder}m ({entry.shifts} shifts)</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {hasRank(user.rank, "management") ? (
        <Card title="Administrative correction" description="Corrections require a reason and are written to the audit log.">
          <Form method="post" className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="intent" value="shift_edit" />
            <input name="shiftId" placeholder="Shift ID" className={inputClass} />
            <input name="minutes" placeholder="Correct minutes" className={inputClass} />
            <input name="reason" placeholder="Reason" className={inputClass} />
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 sm:col-span-3">Apply correction</button>
          </Form>
          {edits.length > 0 ? (
            <ul className="mt-4 space-y-2 text-xs text-white/55">
              {edits.map((edit: any) => (
                <li key={edit.id}>Shift #{edit.shiftId}: {edit.beforeValue} to {edit.afterValue} minutes by {edit.actorName} - {edit.reason}</li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}
    </>
  );
}
