import { redirect } from "react-router";

export const SESSION_COOKIE = "cc_session";

export const RANK_ORDER = ["member", "trial_moderator", "moderator", "senior_moderator", "management", "owner"] as const;

export const RANKS = RANK_ORDER;

export const RANK_LABELS: Record<string, string> = {
  member: "Member",
  trial_moderator: "Trial Moderator",
  moderator: "Moderator",
  senior_moderator: "Senior Moderator",
  management: "Management",
  owner: "Owner",
};

export function rankLevel(rank: string): number {
  const i = (RANK_ORDER as readonly string[]).indexOf(rank);
  return i < 0 ? 0 : i;
}

export function hasRank(rank: string, minimum: string): boolean {
  return rankLevel(rank) >= rankLevel(minimum);
}

export interface SessionUser {
  id: number;
  username: string;
  rank: string;
  isReviewer: boolean;
  createdAt: string;
}

export function portal(context: any): any {
  return context.cloudflare.env.PORTAL.getByName("cipher-coast");
}

export function readToken(request: Request): string {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export async function currentUser(context: any, request: Request): Promise<SessionUser | null> {
  const token = readToken(request);
  if (!token) return null;
  const user = await portal(context).userFromToken(token);
  return (user as SessionUser | null) ?? null;
}

export async function requireUser(context: any, request: Request): Promise<SessionUser> {
  const user = await currentUser(context, request);
  if (!user) {
    const url = new URL(request.url);
    throw redirect("/login?next=" + encodeURIComponent(url.pathname + url.search));
  }
  return user;
}

export async function requireStaff(context: any, request: Request): Promise<SessionUser> {
  const user = await requireUser(context, request);
  if (!hasRank(user.rank, "trial_moderator")) {
    throw redirect("/dashboard?denied=staff");
  }
  return user;
}

export async function requireRank(context: any, request: Request, minimum: string): Promise<SessionUser> {
  const user = await requireUser(context, request);
  if (!hasRank(user.rank, minimum)) throw redirect("/dashboard?denied=" + minimum);
  return user;
}

export function sessionCookie(token: string): string {
  return SESSION_COOKIE + "=" + encodeURIComponent(token) + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + 60 * 60 * 24 * 30;
}

export function clearedCookie(): string {
  return SESSION_COOKIE + "=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

export function signedInRedirect(target: string, token: string): Response {
  return redirect(target, { headers: { "Set-Cookie": sessionCookie(token) } });
}

export function safeNext(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
