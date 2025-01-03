/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

type PagesFunction<E = unknown> = (context: EventContext<E, string, unknown>) => Promise<Response>;