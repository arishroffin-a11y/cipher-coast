import { Form, Link } from "react-router";
import type { Route } from "./+types/dash-ticket";
import { runAction } from "~/lib/actions.server";
import { hasRank, portal, requireUser } from "~/lib/server";
import { Card, Message, Notice, PageHeader, inputClass } from "~/components/ui-bits";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: "Ticket #" + params.id + " - Cipher Coast" }];
}

export async function loader({ context, request, params }: Route.LoaderArgs) {
  const user = await requireUser(context, request);
  const isStaff = hasRank(user.rank, "trial_moderator");
  const ticket = await portal(context).getTicket(user.id, Number(params.id), isStaff);
  return { user, isStaff, ticket };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireUser(context, request);
  return runAction(context, request, user);
}

export default function Ticket({ loaderData, actionData }: Route.ComponentProps) {
  const { ticket, user, isStaff } = loaderData;
  const claimant = ticket.claimant_id ? Number(ticket.claimant_id) : null;
  const mine = claimant === user.id;
  const closed = ticket.status === "closed";

  return (
    <>
      <PageHeader
        title={"Ticket #" + ticket.id}
        subtitle={"Opened by " + ticket.username + " - status " + ticket.status + (claimant ? " - claimed by " + ticket.claimant_name : "")}
        action={<Link to="/dashboard/tickets" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10">All tickets</Link>}
      />
      {actionData ? <Message data={actionData} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Conversation" description="Messages are private to the ticket owner and the support team.">
          <div className="space-y-3">
            {ticket.messages.length === 0 ? <p className="text-sm text-white/50">No messages yet.</p> : null}
            {ticket.messages.map((message: any) => (
              <div key={message.id} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
                <p className="text-xs text-white/45">{message.authorName} - {message.createdAt}</p>
                <p className="mt-1 text-sm whitespace-pre-line text-white/85">{message.body}</p>
              </div>
            ))}
          </div>
          {!closed ? (
            <Form method="post" className="mt-4 space-y-3">
              <input type="hidden" name="intent" value="ticket_message" />
              <input type="hidden" name="ticketId" value={ticket.id} />
              <textarea name="body" rows={3} required placeholder="Write a reply" className={inputClass} />
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Send reply</button>
            </Form>
          ) : (
            <Notice tone="info">This ticket is closed. Reason: {ticket.close_reason}</Notice>
          )}
        </Card>

        <div className="space-y-6">
          {isStaff ? (
            <Card title="Staff controls" description="Claim to take ownership. Unclaim is limited to the staff member who claimed.">
              <div className="flex flex-wrap gap-2">
                {!claimant ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="ticket_claim" />
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <button disabled={closed} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-40">Claim</button>
                  </Form>
                ) : mine ? (
                  <Form method="post">
                    <input type="hidden" name="intent" value="ticket_unclaim" />
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <button disabled={closed} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-40">Unclaim</button>
                  </Form>
                ) : (
                  <span className="text-xs text-white/45">Claimed by {ticket.claimant_name} - only they can unclaim.</span>
                )}
              </div>

              <Form method="post" className="mt-4 space-y-2">
                <input type="hidden" name="intent" value="ticket_rename" />
                <input type="hidden" name="ticketId" value={ticket.id} />
                <label className="block text-xs tracking-wide text-white/55 uppercase">Rename ticket</label>
                <input name="name" placeholder="new-ticket-name" className={inputClass} />
                <button className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white transition hover:bg-white/10">Rename</button>
              </Form>

              <Form method="post" className="mt-4 space-y-2">
                <input type="hidden" name="intent" value="ticket_close" />
                <input type="hidden" name="ticketId" value={ticket.id} />
                <label className="block text-xs tracking-wide text-white/55 uppercase">Close ticket</label>
                <input name="reason" placeholder="Close reason (required)" className={inputClass} />
                <button disabled={closed || ticket.status !== "claimed"} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-white/85 disabled:opacity-40">
                  {ticket.status !== "claimed" ? "Claim required to close" : "Close and post transcript"}
                </button>
              </Form>
            </Card>
          ) : null}

          <Card title="Ticket log" description="Transcripts are written to the configured log channel when a ticket closes.">
            <dl className="space-y-2 text-sm text-white/70">
              <div><dt className="text-xs text-white/45 uppercase">Creator</dt><dd>{ticket.username}</dd></div>
              <div><dt className="text-xs text-white/45 uppercase">Claimant</dt><dd>{ticket.claimant_name ?? "unclaimed"}</dd></div>
              <div><dt className="text-xs text-white/45 uppercase">Closer</dt><dd>{ticket.closer_name ?? "open"}</dd></div>
              <div><dt className="text-xs text-white/45 uppercase">Opened</dt><dd>{ticket.created_at}</dd></div>
              <div><dt className="text-xs text-white/45 uppercase">Claimed</dt><dd>{ticket.claimed_at ?? "-"}</dd></div>
              <div><dt className="text-xs text-white/45 uppercase">Closed</dt><dd>{ticket.closed_at ?? "-"}</dd></div>
              <div><dt className="text-xs text-white/45 uppercase">Close reason</dt><dd>{ticket.close_reason ?? "-"}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
