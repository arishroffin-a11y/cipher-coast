import { Form } from "react-router";
import type { Route } from "./+types/dash-staff";
import { runAction } from "~/lib/actions.server";
import { RANKS, RANK_LABELS, hasRank, portal, requireStaff } from "~/lib/server";
import { Card, Empty, Message, Notice, PageHeader, RankBadge, Stat, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Staff Management - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const store = portal(context);
  const isManagement = hasRank(user.rank, "management");
  const isOwner = user.rank === "owner";
  const [users, actions, loas, sessions, notes] = await Promise.all([
    store.listUsers(),
    store.listStaffActions(),
    store.listLoas(),
    store.listSessions(),
    isManagement ? store.listNotes(user.id).catch(() => []) : Promise.resolve([]),
  ]);
  return { user, users, actions, loas, notes, isManagement, isOwner, activeSession: sessions.find((s: any) => s.status === "active") ?? null };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function StaffManagement({ loaderData, actionData }: Route.ComponentProps) {
  const { users, actions, loas, notes, user, isManagement, isOwner, activeSession } = loaderData;
  const reminders = loas.filter((loa: any) => loa.reminder);
  const pendingLoas = loas.filter((loa: any) => loa.status === "pending");
  const staffRequests = actions.filter((entry: any) => entry.type === "staff_request");

  return (
    <>
      <PageHeader
        title="Staff management"
        subtitle={isOwner ? "Owners control ranks, reviewers and every audit entry." : isManagement ? "Promotions, infractions, LOAs and notes." : "Request LOA and read the staff actions record."}
      />
      {actionData ? <Message data={actionData} /> : null}

      {reminders.length > 0 ? (
        <Notice tone="warn">
          LOA reminder: {reminders.map((loa: any) => loa.userName + " returns in " + loa.daysLeft + " day(s)").join(", ")}.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Accounts" value={users.length} />
        <Stat label="Pending LOAs" value={pendingLoas.length} />
        <Stat label="Recorded actions" value={actions.length} />
        <Stat label="Session" value={activeSession ? "Active #" + activeSession.id : "None"} hint="Staff requests need an active session" />
      </div>

      {isOwner ? (
        <Card title="Ranks and reviewers" description="Owner-only. Reviewers can read applications and decide on them.">
          <div className="space-y-3">
            {users.map((entry: any) => (
              <div key={entry.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-white/90">{entry.username} <RankBadge rank={entry.rank} /> {entry.isReviewer ? <span className="ml-2 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/70 uppercase">Reviewer</span> : null}</span>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <Form method="post" className="flex flex-wrap gap-2">
                    <input type="hidden" name="intent" value="staff_rank" />
                    <input type="hidden" name="userId" value={entry.id} />
                    <select name="rank" defaultValue={entry.rank} className="rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white">
                      {RANKS.map((rank) => (
                        <option key={rank} value={rank}>{RANK_LABELS[rank]}</option>
                      ))}
                    </select>
                    <input name="reason" placeholder="Reason" className={inputClass + " max-w-56"} />
                    <button className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/85">Set rank</button>
                  </Form>
                  <Form method="post" className="flex flex-wrap gap-2">
                    <input type="hidden" name="intent" value="staff_reviewer" />
                    <input type="hidden" name="userId" value={entry.id} />
                    <input type="hidden" name="enabled" value={entry.isReviewer ? "no" : "yes"} />
                    <button className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white transition hover:bg-white/10">
                      {entry.isReviewer ? "Remove reviewer role" : "Appoint as application reviewer"}
                    </button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {isManagement ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Promote a staff member" description="Target, new rank and reason are recorded and audited.">
            <Form method="post" className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="intent" value="staff_promote" />
              <select name="userId" className={inputClass}>
                {users.map((entry: any) => (
                  <option key={entry.id} value={entry.id}>{entry.username} ({RANK_LABELS[entry.rank] ?? entry.rank})</option>
                ))}
              </select>
              <select name="rank" className={inputClass} defaultValue="moderator">
                {RANKS.map((rank) => (
                  <option key={rank} value={rank}>{RANK_LABELS[rank]}</option>
                ))}
              </select>
              <input name="reason" required placeholder="Reason" className={inputClass + " sm:col-span-2"} />
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 sm:col-span-2">Promote</button>
            </Form>
          </Card>

          <Card title="Issue an infraction" description="The affected staff member is notified.">
            <Form method="post" className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="intent" value="staff_infract" />
              <select name="userId" className={inputClass}>
                {users.map((entry: any) => (
                  <option key={entry.id} value={entry.id}>{entry.username}</option>
                ))}
              </select>
              <input name="infraction" required placeholder="Infraction" className={inputClass} />
              <input name="reason" required placeholder="Reason" className={inputClass + " sm:col-span-2"} />
              <button className="rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/15 sm:col-span-2">Record infraction</button>
            </Form>
          </Card>
        </div>
      ) : null}

      <Card title="Staff request" description="Staff requests can only be created while a session is active.">
        <Form method="post" className="flex flex-wrap gap-3">
          <input type="hidden" name="intent" value="staff_request" />
          <input name="reason" required placeholder="What do you need?" className={inputClass + " min-w-64 flex-1"} />
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Post request</button>
        </Form>
        {staffRequests.length === 0 ? (
          <div className="mt-4"><Empty>No pending staff requests.</Empty></div>
        ) : (
          <div className="mt-4 space-y-2">
            {staffRequests.map((request: any) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/75">
                <span>#{request.id} {request.targetName}: {request.reason}</span>
                {isManagement ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="staff_request_ack" />
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className="rounded-md border border-white/15 px-2 py-1 text-xs text-white transition hover:bg-white/10">Acknowledge</button>
                  </Form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Leave of absence" description="Management accept or deny with a reason. Approved LOAs approaching their end date raise a reminder.">
        <Form method="post" className="grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="intent" value="loa_request" />
          <input name="timeframe" required placeholder="Timeframe" className={inputClass} />
          <input name="startDate" type="date" required className={inputClass} />
          <input name="endDate" type="date" required className={inputClass} />
          <input name="reason" required placeholder="Reason" className={inputClass} />
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 sm:col-span-4">Request LOA</button>
        </Form>
        <div className="mt-5 space-y-3">
          {loas.length === 0 ? <Empty>No LOA requests.</Empty> : loas.map((loa: any) => (
            <div key={loa.id} className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/75">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-white/90">{loa.userName} - {loa.timeframe}</span>
                <span className="text-xs text-white/45">{loa.startDate} to {loa.endDate} | {loa.status}{loa.reminder ? " | ends soon" : ""}</span>
              </div>
              <p className="mt-1 text-xs text-white/50">{loa.reason}</p>
              {loa.decisionReason ? <p className="mt-1 text-xs text-white/45">Decision: {loa.decisionReason}</p> : null}
              {isManagement && loa.status === "pending" ? (
                <div className="mt-3 grid gap-2 lg:grid-cols-2">
                  <Form method="post" className="flex gap-2">
                    <input type="hidden" name="intent" value="loa_decide" />
                    <input type="hidden" name="loaId" value={loa.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <input name="reason" placeholder="Reason" className={inputClass} />
                    <button className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-white/85">Accept</button>
                  </Form>
                  <Form method="post" className="flex gap-2">
                    <input type="hidden" name="intent" value="loa_decide" />
                    <input type="hidden" name="loaId" value={loa.id} />
                    <input type="hidden" name="decision" value="denied" />
                    <input name="reason" placeholder="Reason" className={inputClass} />
                    <button className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-100 transition hover:bg-red-500/15">Deny</button>
                  </Form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Action record" description="Promotions, infractions, reviewer appointments and acknowledgements.">
        {actions.length === 0 ? (
          <Empty>No staff actions recorded.</Empty>
        ) : (
          <div className="space-y-2 text-sm text-white/70">
            {actions.slice(0, 40).map((entry: any) => (
              <div key={entry.id} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <span className="text-white/45">{entry.createdAt} UTC</span> - <span className="text-white/85">{entry.type}</span> - {entry.actorName} to {entry.targetName}: {entry.summary}
                {entry.reason ? <p className="mt-1 text-xs text-white/50">Reason: {entry.reason}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {isManagement ? (
        <Card title="Staff notes" description="Only management can read these.">
          {notes.length === 0 ? (
            <Empty>No staff notes.</Empty>
          ) : (
            <div className="space-y-2 text-sm text-white/70">
              {notes.map((note: any) => (
                <div key={note.id} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                  <span className="text-white/45">{note.createdAt} UTC</span> - {note.authorName}{note.username ? " about " + note.username : ""}: {note.body}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </>
  );
}
