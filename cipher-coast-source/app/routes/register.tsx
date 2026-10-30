import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/register";
import { currentUser, portal, safeNext, signedInRedirect } from "~/lib/server";
import { Field, Notice, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Register - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await currentUser(context, request);
  if (user) throw redirect("/dashboard");
  const url = new URL(request.url);
  return { next: safeNext(url.searchParams.get("next")) };
}

export async function action({ context, request }: Route.ActionArgs) {
  const form = await request.formData();
  const next = safeNext(String(form.get("next") || "/dashboard"));
  const result = await portal(context).register({
    username: String(form.get("username") || ""),
    password: String(form.get("password") || ""),
    confirm: String(form.get("confirm") || ""),
  });
  if (!result.ok) return { error: String(result.error || "Registration failed.") };
  return signedInRedirect(next, String(result.token));
}

export default function Register({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-black px-5 py-16 text-white">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <img src="/clogo.png" alt="Cipher Coast" className="h-14 w-14 rounded-full object-contain" />
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <h1 className="font-display text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-white/55">You will be able to apply for staff and open tickets right away.</p>
          {actionData?.error ? <div className="mt-4"><Notice tone="error">{actionData.error}</Notice></div> : null}
          <Form method="post" className="mt-6 space-y-4">
            <input type="hidden" name="next" value={loaderData.next} />
            <Field label="Username" hint="3-24 characters: letters, numbers, _ . @ -">
              <input name="username" required autoComplete="username" placeholder="yourname" className={inputClass} />
            </Field>
            <Field label="Password">
              <input name="password" type="password" required autoComplete="new-password" className={inputClass} />
            </Field>
            <Field label="Confirm password">
              <input name="confirm" type="password" required autoComplete="new-password" className={inputClass} />
            </Field>
            <button type="submit" className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85">
              Create account
            </button>
          </Form>
          <p className="mt-5 text-center text-sm text-white/50">
            Already registered? <Link to="/login" className="text-white underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
