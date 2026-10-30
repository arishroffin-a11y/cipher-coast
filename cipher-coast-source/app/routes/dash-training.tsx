import { useState } from "react";
import { Form } from "react-router";
import type { Route } from "./+types/dash-training";
import { runAction } from "~/lib/actions.server";
import { hasRank, portal, requireStaff } from "~/lib/server";
import { Card, Empty, Message, PageHeader, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Training - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const store = portal(context);
  const [requests, trainings, config] = await Promise.all([store.listTrainingRequests(), store.listTrainings(), store.getConfig()]);
  return { user, requests, trainings, config, canHost: hasRank(user.rank, "moderator") };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function Training({ loaderData, actionData }: Route.ComponentProps) {
  const { requests, trainings, config, user, canHost } = loaderData;
  const [driving, setDriving] = useState(0);
  const [moderation, setModeration] = useState(0);
  const total = Number(driving) + Number(moderation);
  const passed = total >= Number(config.trainingPassTotal);

  return (
    <>
      <PageHeader title="Training" subtitle={"Scores are graded out of 20. The pass mark is " + config.trainingPassTotal + "/20."} />
      {actionData ? <Message data={actionData} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Request training" description="Requests use the standard template and ping the high ranks.">
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="training_request" />
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/70">
              <p>User: {user.username}</p>
              <p>Time: -</p>
              <p>Date: -</p>
              <p>Ping: @High Rank</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="date" type="date" required className={inputClass} />
              <input name="time" placeholder="Time (e.g. 20:00 UTC)" required className={inputClass} />
            </div>
            <textarea name="notes" rows={2} placeholder="Anything the trainer should know" className={inputClass} />
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Send request</button>
          </Form>
        </Card>

        <Card title="Record a result" description="The total is calculated automatically and validated between 0 and 20.">
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="training_result" />
            <input name="trainee" required placeholder="Trainee username" className={inputClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-white/70">
                Driving /10
                <input name="driving" type="number" min={0} max={10} value={driving} onChange={(event) => setDriving(Number(event.target.value))} className={inputClass + " mt-1"} />
              </label>
              <label className="text-sm text-white/70">
                Moderation ability /10
                <input name="moderation" type="number" min={0} max={10} value={moderation} onChange={(event) => setModeration(Number(event.target.value))} className={inputClass + " mt-1"} />
              </label>
            </div>
            <input name="heldOn" type="date" className={inputClass} />
            <textarea name="notes" rows={2} placeholder="Trainer notes" className={inputClass} />
            <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white/75">
              Training Result<br />
              Trainee: {""}<br />
              Driving: {driving}/10<br />
              Moderation ability: {moderation}/10<br />
              Total: {total}/20<br />
              <span className={passed ? "text-emerald-200" : "text-amber-200"}>{passed ? "Pass" : "Fail"}</span>
            </div>
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Save result</button>
          </Form>
        </Card>
      </div>

      <Card title="Training requests" description="Start a request with notes and a location - both are required.">
        {requests.length === 0 ? (
          <Empty>No training requests yet.</Empty>
        ) : (
          <div className="space-y-3">
            {requests.map((request: any) => (
              <div key={request.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white/90">#{request.id} {request.userName}</p>
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] tracking-wide text-white/60 uppercase">{request.status}</span>
                </div>
                <p className="mt-1 text-xs text-white/45">Time: {request.time} | Date: {request.date} | Ping: {request.ping}</p>
                {request.notes ? <p className="mt-1 text-sm text-white/60">{request.notes}</p> : null}
                {canHost && request.status === "pending" ? (
                  <Form method="post" className="mt-3 grid gap-2 sm:grid-cols-3">
                    <input type="hidden" name="intent" value="training_start" />
                    <input type="hidden" name="requestId" value={request.id} />
                    <input name="location" placeholder="Location / place" className={inputClass} />
                    <input name="notes" placeholder="Start notes" className={inputClass} />
                    <button className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/85">Start training</button>
                  </Form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Recorded results" description="Trainer, trainee, scores, notes and outcome.">
        {trainings.length === 0 ? (
          <Empty>No results recorded yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs tracking-wide text-white/45 uppercase">
                <tr>
                  <th className="py-2 pr-4">Trainee</th>
                  <th className="py-2 pr-4">Trainer</th>
                  <th className="py-2 pr-4">Driving</th>
                  <th className="py-2 pr-4">Moderation</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Outcome</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="text-white/75">
                {trainings.map((entry: any) => (
                  <tr key={entry.id} className="border-t border-white/10">
                    <td className="py-2 pr-4">{entry.trainee}</td>
                    <td className="py-2 pr-4">{entry.trainerName}</td>
                    <td className="py-2 pr-4">{entry.driving}/10</td>
                    <td className="py-2 pr-4">{entry.moderation}/10</td>
                    <td className="py-2 pr-4">{entry.total}/20</td>
                    <td className="py-2 pr-4">{entry.passed ? "Pass" : "Fail"}</td>
                    <td className="py-2 pr-4">{entry.heldOn}</td>
                    <td className="py-2 max-w-64">{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
