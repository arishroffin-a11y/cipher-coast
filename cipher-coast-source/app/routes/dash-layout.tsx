import { Form, Link, Outlet, redirect } from "react-router";
import type { Route } from "./+types/dash-layout";
import { DashNav } from "~/components/dash-nav";
import { RANK_LABELS, currentUser, portal } from "~/lib/server";

export function meta() {
  return [{ title: "Staff Dashboard - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await currentUser(context, request);
  if (!user) throw redirect("/login?next=" + encodeURIComponent(new URL(request.url).pathname));
  const data = await portal(context).dashboardData(user.id);
  return { user: data.user, counts: data.counts, isStaff: data.isStaff };
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  const { user, counts } = loaderData;

  return (
    <div className="min-h-svh bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/clogo.png" alt="Cipher Coast" className="h-9 w-9 rounded-full object-contain" />
            <span className="font-display text-xs font-semibold tracking-[0.22em] uppercase">Cipher Coast</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-white/50 sm:inline">{counts.onlineStaff} on shift</span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
              {user.username} - {RANK_LABELS[user.rank] ?? user.rank}
              {user.isReviewer && user.rank !== "owner" ? " | Reviewer" : ""}
            </span>
            <Form method="post" action="/logout">
              <button type="submit" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/10">
                Sign out
              </button>
            </Form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="lg:sticky lg:top-20">
            <DashNav rank={user.rank} isReviewer={Boolean(user.isReviewer)} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
