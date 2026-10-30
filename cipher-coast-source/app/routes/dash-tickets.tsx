import { Form, Link } from "react-router";
import type { Route } from "./+types/dash-tickets";
import { runAction } from "~/lib/actions.server";
import { portal, requireUser, hasRank } from "~/lib/server";
import { Card, Empty, Message, PageHeader, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Tickets - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireUser(context, request);
  const isStaff = hasRank(user.rank, "trial_moderator");
  const tickets = await portal(context).listTickets(user.id, isStaff);
  return { user, isStaff, tickets };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireUser(context, request);
  return runAction(context, request, user);
}

export default function Tickets({ loaderData, actionData }: Route.ComponentProps) {
  const { isStaff, tickets, user } = loaderData;
  return (
    <>
      <PageHeader
        title={isStaff ? "Ticket queue" : "Your tickets"}
        subtitle={isStaff ? "Claim, rename and close assistance tickets. Closing is only enabled once a ticket is claimed." : "Private support tickets - one open ticket per type."}
      />
      {actionData ? <Message data={actionData} /> : null}

      <Card title="Open an assistance ticket" description="Support staff with the configured support role respond to claimed tickets.">
        <Form method="post" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="intent" value="ticket_create" />
          <input type="hidden" name="type" value="assistance" />
          <label className="min-w-64 flex-1 text-sm text-white/70">
            Subject
            <input name="subject" required placeholder="Short summary of the issue" className={inputClass + " mt-1"} />
          </label>
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Open ticket</button>
        </Form>
      </Card>

      {tickets.length === 0 ? (
        <Empty>No tickets yet.</Empty>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <Link key={ticket.id} to={"/dashboard/tickets/" + ticket.id} className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/25">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-white/90">#{ticket.id} {ticket.subject}</p>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] tracking-wide text-white/60 uppercase">{ticket.status}</span>
              </div>
              <p className="mt-1 text-xs text-white/45">
                Opened by {ticket.username} - {ticket.messages} messages
                {ticket.claimantName ? " | claimed by " + ticket.claimantName : ""}
                {ticket.closerName ? " | closed by " + ticket.closerName : ""}
              </p>
              {ticket.closeReason ? <p className="mt-1 text-xs text-white/45">Reason: {ticket.closeReason}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
