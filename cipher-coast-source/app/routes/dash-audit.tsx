import { Form } from "react-router";
import type { Route } from "./+types/dash-audit";
import { runAction } from "~/lib/actions.server";
import { hasRank, portal, requireStaff } from "~/lib/server";
import { Card, Empty, Message, Notice, PageHeader, Stat, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Audit & Status - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const store = portal(context);
  const [audit, status, config] = await Promise.all([store.listAudit(user.id, 150), store.status(), store.getConfig()]);
  return { user, audit, status, config, isOwner: user.rank === "owner", isManagement: hasRank(user.rank, "management") };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function Audit({ loaderData, actionData }: Route.ComponentProps) {
  const { audit, status, isOwner, isManagement } = loaderData;
  return (
    <>
      <PageHeader title="Audit, status and reports" subtitle="Every privileged action is written to the audit trail, including errors." />
      {actionData ? <Message data={actionData} /> : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Database" value={status.database} hint={status.checkedAt.slice(0, 19).replace("T", " ")} />
        <Stat label="Accounts" value={status.counts.users} />
        <Stat label="Cases" value={status.counts.mod_cases} />
        <Stat label="Active shifts" value={status.activeShifts} />
      </div>

      <Card title="Health check" description="Row counts and recent bot-level errors.">
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(status.counts).map(([table, count]) => (
            <div key={table} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/70">
              {table}: <span className="text-white">{String(count)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {status.recentErrors.length === 0 ? (
            <Notice tone="success">No runtime errors recorded.</Notice>
          ) : (
            status.recentErrors.map((error: any) => (
              <Notice key={error.id} tone="error">{error.scope}: {error.message}</Notice>
            ))
          )}
        </div>
      </Card>

      <Card title="Audit log" description="Newest first - staff visibility.">
        {audit.length === 0 ? (
          <Empty>No audit entries yet.</Empty>
        ) : (
          <div className="max-h-[30rem] space-y-2 overflow-y-auto text-sm">
            {audit.map((entry: any) => (
              <div key={entry.id} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white/70">
                <span className="text-white/45">{entry.createdAt} UTC</span> - <span className="text-white/85">{entry.action}</span> by {entry.actorName ?? "system"}
                <p className="mt-1 text-xs whitespace-pre-line text-white/55">{entry.detail}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isManagement ? (
        <Card title="Staff notes" description="Restricted to management.">
          <Form method="post" className="grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="intent" value="staff_note" />
            <input name="userId" placeholder="User ID (optional)" className={inputClass} />
            <input name="body" placeholder="Note" className={inputClass + " sm:col-span-2"} />
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Save note</button>
          </Form>
        </Card>
      ) : null}

      {isOwner ? (
        <Card title="Backup guidance" description="Operational notes for whoever holds the owner account.">
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/65">
            <li>Durable Object storage keeps every table (accounts, applications, tickets, shifts, audit). It survives restarts and deploys.</li>
            <li>Use the audit log and health panel above to detect data problems early; every write is recorded with the acting account.</li>
            <li>Export regularly if you keep offline records, and keep owner credentials private - owners can change every rank and panel.</li>
            <li>Rotate the seeded owner passwords as soon as the portal is in real use.</li>
          </ul>
        </Card>
      ) : null}
    </>
  );
}
