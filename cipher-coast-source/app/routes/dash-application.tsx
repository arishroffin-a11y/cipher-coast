import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/dash-application";
import { runAction } from "~/lib/actions.server";
import { portal, requireUser } from "~/lib/server";
import { APPLICATION_QUESTIONS } from "~/lib/application-questions";
import { TypingPlayback } from "~/components/typing-playback";
import { Card, Message, Notice, PageHeader, inputClass } from "~/components/ui-bits";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: "Application #" + params.id + " - Cipher Coast" }];
}

export async function loader({ context, request, params }: Route.LoaderArgs) {
  const user = await requireUser(context, request);
  const canReview = user.rank === "owner" || Boolean(user.isReviewer);
  if (!canReview) throw redirect("/dashboard?denied=reviewer");
  const application = await portal(context).getApplication(user.id, Number(params.id), canReview);
  return { user, application };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireUser(context, request);
  return runAction(context, request, user);
}

export default function Application({ loaderData, actionData }: Route.ComponentProps) {
  const { application } = loaderData;
  const answers = application.answers as Record<string, string>;
  const typing = application.typing as Record<string, any>;
  const pending = application.status === "pending";

  return (
    <>
      <PageHeader
        title={"Application #" + application.id + " - " + application.username}
        subtitle={"Status: " + application.status + " | submitted " + application.createdAt + (application.reviewerName ? " | reviewed by " + application.reviewerName : "")}
        action={<Link to="/dashboard/applications" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75 transition hover:bg-white/10">All applications</Link>}
      />
      {actionData ? <Message data={actionData} /> : null}

      {pending ? (
        <Card title="Decision" description="A reason is required. Accepting grants the Trial Moderator rank and dashboard access, and the applicant is notified.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="application_decide" />
              <input type="hidden" name="applicationId" value={application.id} />
              <input type="hidden" name="decision" value="accepted" />
              <input name="reason" required placeholder="Reason for acceptance" className={inputClass} />
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Accept application</button>
            </Form>
            <Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="application_decide" />
              <input type="hidden" name="applicationId" value={application.id} />
              <input type="hidden" name="decision" value="denied" />
              <input name="reason" required placeholder="Reason for denial (sent to the applicant)" className={inputClass} />
              <button className="rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/15">Deny application</button>
            </Form>
          </div>
        </Card>
      ) : (
        <Notice tone={application.status === "accepted" ? "success" : "warn"}>
          {application.status === "accepted" ? "Accepted" : "Denied"} by {application.reviewerName} - {application.reason}
        </Notice>
      )}

      <div className="space-y-4">
        {APPLICATION_QUESTIONS.map((question, index) => {
          const answer = answers[question.id] ?? "";
          const trace = typing[question.id];
          const pasted = (trace?.pastes ?? 0) > 0 || answer.length > 40 && (trace?.keystrokes ?? 0) < answer.length / 20;
          return (
            <Card key={question.id} title={(index + 1) + ". " + question.prompt} description={answer.length + " characters" + (pasted ? " - pasted or bulk-inserted, review carefully" : "")}>
              <p className="text-sm whitespace-pre-line text-white/85">{answer || "(no answer)"}</p>
              <div className="mt-4">
                <TypingPlayback label="Typing playback" answer={answer} trace={trace} />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
