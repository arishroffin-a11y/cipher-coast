import { Form } from "react-router";
import type { Route } from "./+types/dash-sessions";
import { runAction } from "~/lib/actions.server";
import { hasRank, portal, requireStaff } from "~/lib/server";
import { Card, Empty, Message, PageHeader, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Sessions - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const store = portal(context);
  const [sessions, config] = await Promise.all([store.listSessions(), store.getConfig()]);
  return { user, sessions, config, canHost: hasRank(user.rank, "moderator") };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function Sessions({ loaderData, actionData }: Route.ComponentProps) {
  const { sessions, config, user, canHost } = loaderData;
  const active = sessions.find((session: any) => session.status === "active");

  return (
    <>
      <PageHeader title="Session management" subtitle={"Announcements post to " + config.sessionAnnounceChannel + ". Full sessions lock down three configured channels."} />
      {actionData ? <Message data={actionData} /> : null}

      {canHost ? (
        <Card title="Start a session" description="One active session at a time. Ending cleans up only that session's messages and restores permissions.">
          <Form method="post" className="grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="intent" value="session_start" />
            <select name="kind" className={inputClass} defaultValue="vote">
              <option value="vote">Vote panel</option>
              <option value="low">Low session</option>
              <option value="full">Full session (lockdown)</option>
            </select>
            <input name="notes" placeholder="Notes for the announcement" className={inputClass + " sm:col-span-2"} />
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Start session</button>
          </Form>
          <p className="mt-3 text-xs text-white/45">
            Lockdown channels: {(config.lockdownChannels as string[]).join(", ")} | @everyone ping: {config.sessionPingEveryone ? "enabled" : "disabled"}
          </p>
        </Card>
      ) : null}

      {active ? (
        <Card title={"Active session #" + active.id} description={"Kind: " + active.kind + " | hosted by " + active.hostName}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80">Yes: {active.votesYes}</span>
            <span className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80">No: {active.votesNo}</span>
            <span className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80">Voters: {active.voters}</span>
            {active.lockdown ? <span className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">Lockdown active</span> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Form method="post" className="flex gap-2">
              <input type="hidden" name="intent" value="session_vote" />
              <input type="hidden" name="sessionId" value={active.id} />
              <button name="choice" value="yes" className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black">Vote yes</button>
              <button name="choice" value="no" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white">Vote no</button>
            </Form>
            <Form method="post">
              <input type="hidden" name="intent" value="session_end" />
              <input type="hidden" name="sessionId" value={active.id} />
              <button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white transition hover:bg-white/10">End session</button>
            </Form>
          </div>
          <div className="mt-4 grid gap-2 text-xs text-white/55">
            {active.votes.length === 0 ? <p>No votes yet.</p> : active.votes.map((vote: any) => <p key={vote.user}>{vote.user} voted {vote.choice}</p>)}
          </div>
        </Card>
      ) : (
        <Empty>No active session.</Empty>
      )}

      <Card title="Session history" description="Vote tallies, lockdown state and cleanup records.">
        {sessions.length === 0 ? (
          <Empty>No sessions yet.</Empty>
        ) : (
          <div className="space-y-2">
            {sessions.map((session: any) => (
              <div key={session.id} className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>#{session.id} {session.kind} - {session.hostName}</span>
                  <span className="text-xs text-white/45">{session.status} | {session.votesYes} yes / {session.votesNo} no | started {session.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
