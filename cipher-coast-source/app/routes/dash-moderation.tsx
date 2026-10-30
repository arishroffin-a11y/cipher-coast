import { Form } from "react-router";
import type { Route } from "./+types/dash-moderation";
import { runAction } from "~/lib/actions.server";
import { portal, requireStaff } from "~/lib/server";
import { Card, Empty, Message, PageHeader, Stat, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Moderation - Cipher Coast" }];
}

const ACTIONS = ["Warning", "Kick", "Ban", "Vehicle removal", "RDM", "VDM", "Trolling", "NITRP", "FRP", "Staff abuse", "Other"];

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const store = portal(context);
  const [cases, stats] = await Promise.all([store.listCases(), store.staffStats(user.id)]);
  return { user, cases, stats };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function Moderation({ loaderData, actionData }: Route.ComponentProps) {
  const { cases, user, stats } = loaderData;
  const mine = cases.filter((entry: any) => Number(entry.moderatorName === user.username));
  const open = cases.filter((entry: any) => entry.status === "open").length;

  return (
    <>
      <PageHeader title="Moderation" subtitle="Log every action with a reason and evidence. Cases stay visible to the staff team." />
      {actionData ? <Message data={actionData} /> : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Cases logged" value={cases.length} />
        <Stat label="Open cases" value={open} />
        <Stat label="Your cases" value={mine.length} />
        <Stat label="Your rank" value={user.rank === "owner" ? "Owner" : user.rank} />
      </div>

      <Card title="Log a moderation case" description="Target, action and reason are required so the record is useful later.">
        <Form method="post" className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="intent" value="case_create" />
          <input name="target" required placeholder="Target (username or ID)" className={inputClass} />
          <select name="type" className={inputClass} defaultValue="Warning">
            {ACTIONS.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <input name="reason" required placeholder="Reason" className={inputClass + " sm:col-span-2"} />
          <input name="evidence" placeholder="Evidence link or notes" className={inputClass + " sm:col-span-2"} />
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 sm:col-span-2">Log case</button>
        </Form>
      </Card>

      <Card title="Case log" description="Newest first.">
        {cases.length === 0 ? (
          <Empty>No cases logged yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs tracking-wide text-white/45 uppercase">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Moderator</th>
                  <th className="py-2 pr-4">Target</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Update</th>
                </tr>
              </thead>
              <tbody className="text-white/75">
                {cases.map((entry: any) => (
                  <tr key={entry.id} className="border-t border-white/10 align-top">
                    <td className="py-2 pr-4 text-white/45">{entry.id}</td>
                    <td className="py-2 pr-4">{entry.moderatorName}</td>
                    <td className="py-2 pr-4">{entry.target}</td>
                    <td className="py-2 pr-4">{entry.type}</td>
                    <td className="py-2 pr-4 max-w-64">{entry.reason}{entry.evidence ? " - " + entry.evidence : ""}</td>
                    <td className="py-2 pr-4">{entry.status}</td>
                    <td className="py-2">
                      <Form method="post" className="flex items-center gap-2">
                        <input type="hidden" name="intent" value="case_status" />
                        <input type="hidden" name="caseId" value={entry.id} />
                        <select name="status" defaultValue={entry.status} className="rounded-md border border-white/15 bg-black px-2 py-1 text-xs text-white">
                          <option value="open">open</option>
                          <option value="resolved">resolved</option>
                          <option value="appealed">appealed</option>
                        </select>
                        <button className="rounded-md border border-white/15 px-2 py-1 text-xs text-white transition hover:bg-white/10">Save</button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Staff activity" description="Review output, cases, tickets and training delivered.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs tracking-wide text-white/45 uppercase">
              <tr>
                <th className="py-2 pr-4">Staff</th>
                <th className="py-2 pr-4">Rank</th>
                <th className="py-2 pr-4">Cases</th>
                <th className="py-2 pr-4">Tickets claimed</th>
                <th className="py-2 pr-4">Tickets closed</th>
                <th className="py-2 pr-4">Trainings</th>
                <th className="py-2 pr-4">Reviews</th>
                <th className="py-2">Shift minutes</th>
              </tr>
            </thead>
            <tbody className="text-white/75">
              {stats.map((entry: any) => (
                <tr key={entry.id} className="border-t border-white/10">
                  <td className="py-2 pr-4">{entry.username}</td>
                  <td className="py-2 pr-4">{entry.rank}</td>
                  <td className="py-2 pr-4">{entry.cases}</td>
                  <td className="py-2 pr-4">{entry.ticketsClaimed}</td>
                  <td className="py-2 pr-4">{entry.ticketsClosed}</td>
                  <td className="py-2 pr-4">{entry.trainingsRun}</td>
                  <td className="py-2 pr-4">{entry.reviews}</td>
                  <td className="py-2">{Math.round(Number(entry.shiftMinutes))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
