import { dispatchWorkerApi, type WorkerEnv, type CfExecutionContext } from "../src/worker-api.ts";

interface PagesMiddlewareContext {
  request: Request;
  env: Record<string, unknown>;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  next(): Promise<Response>;
}

/**
 * Production bindings: D1 database, stable OAuth signing key, and Shadow HMAC key.
 * Run ChatFXP's existing API dispatcher inside Pages Functions.
 * Static pages and public assets continue through Pages' asset pipeline.
 */
export async function onRequest(context: PagesMiddlewareContext): Promise<Response> {
  const url = new URL(context.request.url);
  const isApiRequest = url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/");
  if (!isApiRequest) {
    return context.next();
  }

  try {
    const env = context.env as unknown as WorkerEnv;
    const executionContext = context as unknown as CfExecutionContext;
    const response = await dispatchWorkerApi(context.request, url, env, executionContext);
    return response ?? context.next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected API error";
    return Response.json(
      { error: "ChatFXP API request failed", detail: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
