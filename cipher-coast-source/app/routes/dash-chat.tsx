import { useEffect, useRef, useState } from "react";
import { Form, useFetcher } from "react-router";
import type { Route } from "./+types/dash-chat";
import { runAction } from "~/lib/actions.server";
import { RANK_LABELS, portal, requireStaff } from "~/lib/server";
import { Message, Notice, PageHeader, inputClass } from "~/components/ui-bits";

export function meta() {
  return [{ title: "Staff Chat - Cipher Coast" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await requireStaff(context, request);
  const url = new URL(request.url);
  const after = Number(url.searchParams.get("after") || 0);
  const channel = url.searchParams.get("channel") || "staff-general";
  const messages = await portal(context).listChat(channel, after);
  return { user, messages, channel, after };
}

export async function action({ context, request }: Route.ActionArgs) {
  const user = await requireStaff(context, request);
  return runAction(context, request, user);
}

export default function StaffChat({ loaderData, actionData }: Route.ComponentProps) {
  const [messages, setMessages] = useState<any[]>(loaderData.messages);
  const [draft, setDraft] = useState("");
  const lastId = useRef<number>(loaderData.messages.length ? Number(loaderData.messages[loaderData.messages.length - 1].id) : 0);
  const poller = useFetcher<{ messages: any[] }>();
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(loaderData.messages);
    lastId.current = loaderData.messages.length ? Number(loaderData.messages[loaderData.messages.length - 1].id) : 0;
  }, [loaderData.messages]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (poller.state === "idle") poller.load("/dashboard/chat?after=" + lastId.current + "&channel=" + loaderData.channel);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [poller, loaderData.channel]);

  useEffect(() => {
    const incoming = poller.data?.messages ?? [];
    if (incoming.length === 0) return;
    setMessages((previous) => {
      const seen = new Set(previous.map((message) => message.id));
      const merged = previous.slice();
      for (const message of incoming) if (!seen.has(message.id)) merged.push(message);
      return merged;
    });
    lastId.current = Number(incoming[incoming.length - 1].id);
  }, [poller.data]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <>
      <PageHeader title="Staff chat" subtitle="Live channel for the staff team. New messages arrive automatically." />
      {actionData ? <Message data={actionData} /> : null}
      {actionData && actionData.ok ? <Notice tone="success">Message sent.</Notice> : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/50">
          <span>#{loaderData.channel}</span>
          <span>{messages.length} messages</span>
        </div>
        <div className="max-h-[28rem] space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? <p className="text-sm text-white/45">No messages yet. Say hello to the team.</p> : null}
          {messages.map((message) => (
            <div key={message.id} className={"flex gap-3 " + (message.userId === loaderData.user.id ? "justify-end" : "")}>
              {message.userId !== loaderData.user.id ? (
                <div className="max-w-[80%] rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                  <p className="text-xs text-white/45">{message.userName} - {RANK_LABELS[message.rank] ?? message.rank} - {message.createdAt} UTC</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-white/85">{message.body}</p>
                </div>
              ) : (
                <div className="max-w-[80%] rounded-xl border border-white/20 bg-white/[0.07] px-3 py-2">
                  <p className="text-xs text-white/45">you - {message.createdAt} UTC</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-white/90">{message.body}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <Form method="post" className="flex gap-2 border-t border-white/10 p-4" onSubmit={() => window.setTimeout(() => setDraft(""), 50)}>
          <input type="hidden" name="intent" value="chat_post" />
          <input type="hidden" name="channel" value={loaderData.channel} />
          <input
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message the staff team"
            className={inputClass}
            autoComplete="off"
          />
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85">Send</button>
        </Form>
      </div>
    </>
  );
}
