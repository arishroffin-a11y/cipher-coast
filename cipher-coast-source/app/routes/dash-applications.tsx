import { Link, redirect } from "react-router";
import type { Route } from "./+types/dash-applications";
import { portal, requireUser } from "~/lib/server";
import { Card, Empty, Notice, PageHeader, Stat } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Applications - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireUser(context, request);
  const canReview = user.rank === "owner" || Boolean(user.isReviewer);
  if (!canReview) throw redirect("/dashboard?denied=reviewer");
  const applications = await portal(context).listApplications();
  return { user, applications };
}

export default function Applications({ loaderData }: Route.ComponentProps) {
  const { applications, user } = loaderData;
  const pending = applications.filter((entry: any) => entry.status === "pending");
  const decided = applications.filter((entry: any) => entry.status !== "pending");

  return (
    <>
      <PageHeader
        title="Application reviews"
        subtitle="Only owners and appointed reviewers can read applications. Every decision records the reviewer and reason."
      />
      <Notice tone="info">
        Answers include typing telemetry. Open an application to replay how each answer was typed and spot AI-generated or pasted responses.
      </Notice>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pending" value={pending.length} />
        <Stat label="Total" value={applications.length} />
        <Stat label="Your access" value={user.rank === "owner" ? "Owner" : "Reviewer"} />
      </div>

      <Card title="Pending review" description="Newest first.">
        {pending.length === 0 ? (
          <Empty>Nothing waiting for review.</Empty>
        ) : (
          <div className="space-y-2">
            {pending.map((entry: any) => (
              <Link key={entry.id} to={"/dashboard/applications/" + entry.id} className="block rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80 transition hover:border-white/25">
                <span className="font-medium">#{entry.id} {entry.username}</span>
                <span className="ml-2 text-xs text-white/45">submitted {entry.createdAt} | rank {entry.rank}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card title="Decided" description="Accepted applicants receive the Trial Moderator rank automatically.">
        {decided.length === 0 ? (
          <Empty>No decisions yet.</Empty>
        ) : (
          <div className="space-y-2">
            {decided.map((entry: any) => (
              <Link key={entry.id} to={"/dashboard/applications/" + entry.id} className="block rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/70 transition hover:border-white/25">
                <span className="font-medium">#{entry.id} {entry.username}</span>
                <span className="ml-2 text-xs text-white/45">{entry.status} by {entry.reviewerName ?? "-"} | {entry.decidedAt ?? ""}</span>
                {entry.reason ? <p className="mt-1 text-xs text-white/45">Reason: {entry.reason}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
