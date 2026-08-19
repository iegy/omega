import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Locale negotiation for every public URL.
 *
 * ── Why this file is `middleware.ts` and not `proxy.ts` ──────────────────────
 *
 * Next.js 16 prints a deprecation notice asking for the newer `proxy` file
 * convention, and this project used it until the Cloudflare pass. It cannot be
 * used here: Next 16 hard-codes **every** `proxy.*` file to the Node.js
 * runtime (`isProxyFile(page)` in `next/dist/build/index.js` writes
 * `functions-config-manifest.json` with `"runtime": "nodejs"`, with no config
 * option to override it), and `@opennextjs/cloudflare` refuses to build a
 * project with Node.js middleware — it aborts with
 * "Node.js middleware is not currently supported."
 *
 * With the `middleware` convention, Next compiles the exact same code to the
 * **edge** runtime and emits it into `middleware-manifest.json`, which is what
 * OpenNext bundles into the Cloudflare Worker. The behaviour, the matcher and
 * next-intl's output are identical; only the compilation target differs.
 *
 * Do NOT run `npx @next/codemod middleware-to-proxy` on this file. Rename it
 * back only once OpenNext supports Node.js middleware, or once Next.js lets a
 * `proxy` file opt into the edge runtime. The deprecation warning during
 * `next build` is expected and harmless.
 */
export default createMiddleware(routing);

export const config = {
  // Run on every path except Next internals, metadata routes and static files.
  matcher: [
    "/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|brand|images|.*\\..*).*)",
  ],
};
