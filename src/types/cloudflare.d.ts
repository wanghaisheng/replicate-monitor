/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
  params: Record<string, string>;
}) => Promise<Response>;
