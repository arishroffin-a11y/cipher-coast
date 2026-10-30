import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { clearedCookie, readToken } from "~/lib/server";
import { portal } from "~/lib/server";

export async function loader() {
  throw redirect("/");
}

export async function action({ context, request }: Route.ActionArgs) {
  const token = readToken(request);
  if (token) await portal(context).logout(token);
  return redirect("/", { headers: { "Set-Cookie": clearedCookie() } });
}

export default function Logout() {
  return null;
}
