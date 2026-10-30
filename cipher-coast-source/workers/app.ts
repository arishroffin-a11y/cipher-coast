import { createRequestHandler } from "react-router";
import type { CamelAiBinding } from "./camelai-binding";
import type { PortalStore } from "./cipher-store";

export { PortalStore } from "./cipher-store";

interface Env {
  ASSETS?: { fetch(request: Request): Promise<Response> | Response };
  CAMELAI: CamelAiBinding;
  PORTAL: DurableObjectNamespace<PortalStore>;
}

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: { env: Env; ctx: ExecutionContext };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

function shouldServeAsset(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return false;
  const pathname = new URL(request.url).pathname;
  return pathname.startsWith("/assets/") || pathname.includes(".") || pathname === "/robots.txt";
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (env.ASSETS && shouldServeAsset(request)) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;
    }
    try {
      return await requestHandler(request, { cloudflare: { env, ctx } });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        await env.PORTAL.getByName("cipher-coast").recordError(new URL(request.url).pathname, message);
      } catch {
        // the error recorder must never mask the original failure
      }
      throw error;
    }
  },
} satisfies ExportedHandler<Env>;
