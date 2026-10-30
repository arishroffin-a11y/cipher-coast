import { Form, Link, useFetcher } from "react-router";
import type { Route } from "./+types/dashboard";
import { runAction } from "~/lib/actions.server";
import { requireUser } from "~/lib/server";
import { portal } from "~/lib/server";
import { Card, Empty, Message, Notice, PageHeader, Stat, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Overview - Cipher Coast Staff Portal" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireUser(context, request);
  const url = new URL(request.url);
  const store = portal(context);
  const data = await store.dashboardData(user.id);
  const [giveaways, sessions, tickets] = await Promise.all([
    store.listGiveaways(user.id),
    store.listSessions(),
    store.listTickets(user.id, data.isStaff),
  ]);
  return {
    data,
    giveaways: giveaways.slice(0, 6),
    sessions: sessions.filter((session: any) => session.status === "active").slice(0, 3),
    tickets: tickets.slice(0, 5),
    denied: url.searchParams.get("denied"),
  };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireUser(context, request);
  return runAction(context, request, user);
}

export default function Dashboard({ loaderData, actionData }: Route.ComponentProps) {
  const { data, giveaways, sessions, tickets, denied } = loaderData;
  const user = data.user;
  const verification = data.verification;
  const fetcher = useFetcher<{ ok?: boolean; error?: string; verified?: boolean; question?: string; role?: string }>();
  const question = fetcher.data?.question ?? verification.question;

  return (
    <>
      <PageHeader
        title={"Welcome back, " + user.username}
        subtitle="Your verification, tickets, giveaways and live sessions in one place."
        action={<Link to="/apply" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Staff application</Link>}
      />

      {denied ? <Notice tone="warn">That section requires a higher rank ({denied}). Ask an owner to promote you.</Notice> : null}
      {actionData && actionData.ok === false ? <Message data={actionData} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Verification" value={verification.status === "verified" ? "Verified" : "Pending"} hint={verification.question ? "Question ready" : "Start the challenge"} />
        <Stat label="Open tickets" value={data.counts.myTickets} hint="Your own tickets" />
        <Stat label="Active giveaways" value={data.counts.activeGiveaways} hint="Enter below" />
        <Stat label="Staff online" value={data.counts.onlineStaff} hint="Currently on shift" />
      </div>

      {user.rank === "member" && !data.isStaff ? (
        <Notice tone="info">
          You are signed in as a member. Complete the staff application - once an owner or appointed reviewer accepts it you receive the Trial Moderator
          rank and full dashboard access.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Verification panel" description="A maths question is generated for every attempt. Correct answers grant the role server-side.">
          {verification.status === "verified" ? (
            <Notice tone="success">Verified. The configured role was granted and duplicate verifications are blocked.</Notice>
          ) : (
            <fetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="verify_answer" />
              {question ? (
                <>
                  <p className="text-sm text-white/60">Question: <span className="font-display text-lg text-white">{String(question)}</span></p>
                  <input name="answer" inputMode="numeric" placeholder="Your answer" className={inputClass} />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Submit answer</button>
                    <button type="submit" name="intent" value="verify_start" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">New question</button>
                  </div>
                </>
              ) : (
                <button type="submit" name="intent" value="verify_start" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Start verification</button>
              )}
              {verification.cooldownUntil ? <p className="text-xs text-amber-200">Cooldown until {new Date(verification.cooldownUntil).toLocaleTimeString()}.</p> : null}
            </fetcher.Form>
          )}
          {fetcher.data?.error ? <div className="mt-3"><Notice tone="error">{fetcher.data.error}</Notice></div> : null}
          {fetcher.data?.verified ? <div className="mt-3"><Notice tone="success">Correct. Role granted: {String(fetcher.data.role)}</Notice></div> : null}
        </Card>

        <Card title="Notifications" description="Decisions, promotions and LOA outcomes are delivered here.">
          {data.notifications.length === 0 ? (
            <Empty>No notifications yet.</Empty>
          ) : (
            <div className="space-y-2">
              {data.notifications.slice(0, 6).map((note: any) => (
                <div key={note.id} className={"rounded-lg border px-3 py-2 text-sm " + (note.read ? "border-white/10 text-white/60" : "border-white/20 bg-white/[0.04] text-white/85")}>
                  {note.body}
                  <span className="ml-2 text-[11px] text-white/35">{new Date(note.createdAt + "Z").toLocaleString()}</span>
                </div>
              ))}
              <Form method="post">
                <input type="hidden" name="intent" value="mark_notifications_read" />
                <button type="submit" className="text-xs text-white/50 underline transition hover:text-white">Mark all as read</button>
              </Form>
            </div>
          )}
        </Card>
      </div>

      {data.isStaff ? (
        <Card title="Your shift" description="Breaks are tracked separately and excluded from active shift time.">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
              {data.shift.active ? (data.shift.onBreak ? "On break" : "On shift") + " - " + data.shift.minutes + " active minutes" : "Off shift"}
            </span>
            <Form method="post" className="flex gap-2">
              {!data.shift.active ? (
                <button name="intent" value="shift_start" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Start shift</button>
              ) : (
                <>
                  <button name="intent" value="shift_break" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                    {data.shift.onBreak ? "End break" : "Take break"}
                  </button>
                  <button name="intent" value="shift_end" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">End shift</button>
                </>
              )}
            </Form>
            <Link to="/dashboard/shifts" className="text-xs text-white/50 underline transition hover:text-white">Leaderboard</Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Live sessions" description="Vote panels, voter lists and lockdown state.">
          {sessions.length === 0 ? (
            <Empty>No active session. Moderators can start one from the Sessions page.</Empty>
          ) : (
            <div className="space-y-4">
              {sessions.map((session: any) => (
                <div key={session.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white/90">Session #{session.id} - {session.kind} - hosted by {session.hostName}</p>
                    <span className="text-xs text-white/50">{session.voters} votes</span>
                  </div>
                  <p className="mt-2 text-sm text-white/60">Yes {session.votesYes} | No {session.votesNo}{session.lockdown ? " | channels locked down" : ""}</p>
                  <fetcher.Form method="post" className="mt-3 flex gap-2">
                    <input type="hidden" name="intent" value="session_vote" />
                    <input type="hidden" name="sessionId" value={session.id} />
                    <button name="choice" value="yes" className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black">Vote yes</button>
                    <button name="choice" value="no" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white">Vote no</button>
                  </fetcher.Form>
                  {session.votes.length > 0 ? (
                    <p className="mt-2 text-xs text-white/45">Voters: {session.votes.map((vote: any) => vote.user + " (" + vote.choice + ")").join(", ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Giveaways" description="Entries are stored persistently and winners are drawn automatically.">
          {giveaways.length === 0 ? (
            <Empty>No giveaways yet.</Empty>
          ) : (
            <div className="space-y-3">
              {giveaways.map((giveaway: any) => (
                <div key={giveaway.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white/90">{giveaway.prize}</p>
                    <span className="text-xs text-white/50">{giveaway.entries} entries | {giveaway.winnerCount} winner(s)</span>
                  </div>
                  <p className="mt-1 text-xs text-white/45">Hosted by {giveaway.hostName} in {giveaway.channel} - {giveaway.status}</p>
                  {giveaway.status === "active" ? (
                    <fetcher.Form method="post" className="mt-3">
                      <input type="hidden" name="intent" value="giveaway_enter" />
                      <input type="hidden" name="giveawayId" value={giveaway.id} />
                      <button className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:bg-white/85" disabled={Boolean(giveaway.entered)}>
                        {giveaway.entered ? "Entered" : "Enter giveaway"}
                      </button>
                    </fetcher.Form>
                  ) : (
                    <p className="mt-2 text-sm text-white/60">Winners: {JSON.parse(giveaway.winners || "[]").join(", ") || "none"}{giveaway.rerolls ? " (rerolled " + giveaway.rerolls + "x)" : ""}</p>
                  )}
                </div>
              ))}
              <Link to="/dashboard/giveaways" className="text-xs text-white/50 underline transition hover:text-white">Manage giveaways</Link>
            </div>
          )}
        </Card>
      </div>

      <Card title="Your tickets" description="Open a private assistance ticket - one open ticket per type at a time.">
        <div className="grid gap-4 lg:grid-cols-2">
          <fetcher.Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="ticket_create" />
            <input type="hidden" name="type" value="assistance" />
            <label className="block text-sm text-white/70">
              What do you need help with?
              <input name="subject" required placeholder="Short summary" className={inputClass + " mt-1"} />
            </label>
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Open ticket</button>
          </fetcher.Form>
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <Empty>No tickets yet.</Empty>
            ) : (
              tickets.map((ticket: any) => (
                <Link key={ticket.id} to={"/dashboard/tickets/" + ticket.id} className="block rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 transition hover:border-white/25">
                  #{ticket.id} {ticket.subject} - <span className="text-xs text-white/50">{ticket.status}{ticket.claimantName ? " by " + ticket.claimantName : ""}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </Card>

      {data.myApplication ? (
        <Card title="Your staff application" description="Decisions are recorded with the reviewer and reason.">
          <p className="text-sm text-white/70">
            Application #{data.myApplication.id} - status: <span className="font-medium">{data.myApplication.status}</span>
            {data.myApplication.reviewerName ? " | reviewed by " + data.myApplication.reviewerName : ""}
          </p>
          {data.myApplication.reason ? <p className="mt-2 text-sm text-white/55">Reason: {data.myApplication.reason}</p> : null}
        </Card>
      ) : null}
    </>
  );
}
