# Code Review: Digital Twin

Date: 2026-04-23
Reviewer: AI code review

This document reviews the Next.js 16 / React 19 Digital Twin application. Findings are grouped by severity. No code has been modified; remedial actions are recommended only.

Scope reviewed:

- `package.json`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/app/api/chat/route.ts`
- `src/components/landing-page.tsx`, `src/components/digital-twin-chat.tsx`
- `src/lib/digital-twin-context.ts`, `src/data/profile.ts`
- `.env`, `.env.example`, `.gitignore`, `README.md`

---

## 1. Critical issues

### 1.1 A real OpenRouter API key is committed-style on disk in `.env`

`.env` contains a live secret:

```1:1:.env
OPENROUTER_API_KEY=sk-or-v1-...
```

`.gitignore` does ignore `.env`, but:

- The key is in plain text on a dev machine and will be picked up by any backup, disk image, or other tool that ignores `.gitignore` (e.g. cloud sync, IDE indexers, AI assistants).
- If `.env` predates the `.gitignore` entry it may still be in the git history. The user reports this directory is "not a git repo", but a future `git init` + `git add .` would have to be careful.
- Sharing the file with an AI assistant (as has just happened during this review) means the key has now been transmitted off-device.

Remedial actions (priority order):

1. **Rotate the OpenRouter key immediately** in the OpenRouter dashboard and replace the value in `.env`.
2. Set a hard spend cap / monthly limit on the OpenRouter key so abuse cannot run up an unbounded bill.
3. If the project ever moves to git, run `git log --all -p -- .env` (or `git filter-repo`) to confirm the key was never committed before publishing the repo.
4. Consider using a secrets manager (1Password CLI, `doppler`, `infisical`, Azure Key Vault, etc.) instead of a flat `.env` for anything beyond a throwaway demo.

### 1.2 `/api/chat` is an open, unauthenticated proxy to a paid LLM API

`src/app/api/chat/route.ts` accepts any POST from any origin and forwards to OpenRouter using your key:

```54:98:src/app/api/chat/route.ts
export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  ...
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      ...
    }),
  });
```

There is no:

- Rate limiting (per IP, per session, or globally).
- Origin / Referer / CSRF check (the only `Origin`-aware browser protection is that this is a same-origin fetch, but a script anywhere can `curl` the endpoint).
- Bot / abuse protection (e.g. Cloudflare Turnstile, hCaptcha, Vercel WAF, App Check).
- Auth (the route is public by design, but there is no per-IP token bucket either).
- Limit on number of turns or total tokens — `sanitizeMessages` only enforces 4,000 chars per message and 10 messages per request, but unlimited *requests*.

If/when this site is published, a single attacker can burn the model's free quota or, on a paid model, your money.

Remedial actions:

1. Add a simple in-memory or Redis token-bucket rate limiter (e.g. `@upstash/ratelimit` on Vercel) keyed by IP and a session cookie.
2. Validate `request.headers.get("origin")` against an allow-list (your deployed domain + `localhost:3000`).
3. Consider a lightweight anti-bot challenge (Turnstile is free).
4. Move to streaming + abort on disconnect so long requests cannot tie up connections.
5. Strongly cap `messages` length and total system+user character count before sending to OpenRouter.

### 1.3 `package.json` declares dependency versions that do not exist

```20:38:package.json
  "dependencies": {
    ...
    "next": "^16.2.4",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    ...
  },
  "devDependencies": {
    ...
    "@types/node": "^25.6.0",
    ...
    "typescript": "^6.0.3"
    ...
  }
```

As of late 2025 / early 2026:

- `typescript@^6.0.3` — TypeScript 6 has not been released. Latest stable is 5.x. `npm install` will either fail or silently resolve to a pre-release.
- `@types/node@^25.6.0` — Node 25 is not an LTS line; `@types/node@25` has no matching runtime guarantee.
- `next@^16.2.4` — Next 16 is very new (or nonexistent at the time the file was written). It works on this machine because `node_modules/` is present, but a fresh `npm install` on another machine could fail or pull a different major.

These look like AI-hallucinated bumps. The fact that `node_modules` exists locally hides the breakage.

Remedial actions:

1. Pin to actual released versions, e.g.

   ```jsonc
   "next": "^15.0.0",
   "react": "^19.0.0",
   "react-dom": "^19.0.0",
   "typescript": "^5.6.0",
   "@types/node": "^22.0.0"
   ```

   (verify exact latest at install time with `npm view <pkg> version`).
2. Commit a `package-lock.json` (already present) and add a CI step (`npm ci`) on a clean machine to prove the lockfile resolves.
3. Add an `engines` field, e.g. `"engines": { "node": ">=20.0.0" }`, so collaborators get a clear error rather than mysterious failures.

---

## 2. High-impact issues

### 2.1 Errors in the chat API are silently swallowed

```126:131:src/app/api/chat/route.ts
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while processing the chat request." },
      { status: 500 },
    );
  }
```

The `catch` discards the underlying error entirely. When something goes wrong (network blip, malformed JSON, provider outage) you get a generic 500 with nothing in the server logs. This makes production support impossible.

Remedial action:

- Bind the error: `} catch (error) { console.error("/api/chat failed", error); ... }`.
- Optionally include a correlation id in the response and the log line for support traceability.
- Add structured logging (pino, Vercel `next/log`) once the project grows.

### 2.2 Chat client relies on object identity to drop the seed message

```112:114:src/components/digital-twin-chat.tsx
        body: JSON.stringify({
          messages: nextMessages.filter((message) => message !== initialMessage),
        }),
```

This works only because `initialMessage` is a single shared module-level object that is placed into `useState` once and never replaced. Any future refactor that:

- maps over `messages` and rebuilds new objects (e.g. for editing/persistence),
- hydrates messages from `localStorage`/server state, or
- introduces React 19 strict-mode double-invocations that re-clone state,

will silently start sending the seed assistant message to the API, polluting context.

Remedial actions:

- Track the seed message via a flag, e.g. give it an explicit `id: "seed"` and filter on that.
- Or store the seed message in a separate `useRef` / constant and only render it; keep `messages` as an empty array initially.

### 2.3 No auto-scroll on new messages

The messages container uses `overflow-y-auto` but nothing scrolls it to the bottom when a new message arrives. Once the conversation passes a few turns, replies appear off-screen and the user has to scroll manually.

Remedial action:

- Add a `useRef` on the scroll container and a `useEffect` that runs on `messages.length` / `isLoading` changes to set `scrollTop = scrollHeight`.

### 2.4 No streaming → poor perceived performance

The model used (`openai/gpt-oss-120b:free`) can produce long answers. The route waits for the full completion before responding, and the UI shows a static "Thinking..." for many seconds.

Remedial actions:

- Switch the API route to a `ReadableStream` response and consume `text/event-stream` from OpenRouter's `stream: true` mode.
- Render incremental tokens client-side (the existing `ReactMarkdown` block can re-render on each chunk).

### 2.5 Trailing 10-message slice silently truncates conversation

```46:51:src/app/api/chat/route.ts
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 4000),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-10);
```

Cost-control intent is fine, but the cut is invisible to the user. Once a conversation passes ten turns the model "forgets" earlier turns mid-thread, which can produce confusing answers ("As I said before…").

Remedial actions:

- Document the limit in the UI ("History limited to last 10 turns to control cost") or
- Switch to a token-budgeted summarisation strategy (summarise older turns before truncating) or
- Make the cap configurable via an env var so you can tune it.

### 2.6 `HTTP-Referer` is hard-coded to localhost

```77:82:src/app/api/chat/route.ts
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Digital Twin Website",
      },
```

OpenRouter uses `HTTP-Referer` and `X-Title` for analytics and per-app rate limits. Hard-coding `localhost:3000` means production traffic will be misattributed and could be lumped with someone else's localhost traffic for shared limits.

Remedial action:

- Read the value from an env var, e.g. `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`.
- Add it to `.env.example`.

---

## 3. Medium issues

### 3.1 `useMemo` is a no-op

```90:90:src/components/digital-twin-chat.tsx
  const displayedMessages = useMemo(() => messages, [messages]);
```

This memoises an identity function on `messages`. It returns `messages` unchanged on every change. Remove it; just use `messages` directly. Misleading code is worse than no code.

### 3.2 `key` uses array index

```186:188:src/components/digital-twin-chat.tsx
          {displayedMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
```

Append-only chat is fine in practice, but if you ever support edit/delete this will reuse keys and React will reconcile incorrectly. Consider giving each message a stable `id` (e.g. `crypto.randomUUID()` at creation time).

### 3.3 No keyboard shortcut to send

Pressing Enter in the textarea inserts a newline; users have to mouse to "Send question". Add a `Cmd/Ctrl+Enter` (or plain Enter with Shift+Enter for newline) handler — common for chat UIs.

### 3.4 Loading announcement is a regular `<p>` not a status region

```206:211:src/components/digital-twin-chat.tsx
          {isLoading ? (
            <div className="max-w-[85%] self-start ...">
              ...
              Thinking...
            </div>
          ) : null}
```

Add `role="status"` (or wrap in `aria-live="polite"`) so screen-reader users hear "Thinking…" and then the answer. The outer container has `aria-live="polite"`, but the loading indicator and the new message both appearing inside that container can collapse into one announcement that misses the transition.

### 3.5 Error display is unbounded

```248:252:src/components/digital-twin-chat.tsx
          {error ? (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          ) : null}
```

Whatever the API returns is rendered raw. OpenRouter's error messages can include model-name hints, billing hints, etc. — generally fine, but consider:

- Truncating to a sensible length.
- Mapping known error codes (401/429/500) to friendly copy.
- Logging the raw error to the console for the user to inspect.

### 3.6 Profile data and prompt context are tightly coupled but separately maintained

`src/lib/digital-twin-context.ts` builds a long string from `profile` at module load. If the profile object grows new fields (e.g. `awards`, `talks`), they will silently *not* appear in the prompt unless the context builder is also updated. There is no schema, no test, no warning.

Remedial action:

- Define `profile` with an explicit TypeScript type so a structural change will cause compile errors at the consumer.
- Or write the context builder to walk the object generically (`Object.entries`) so additions are picked up automatically, with an explicit ignore-list for fields you don't want sent to the model (e.g. `metrics`, `portfolioTeasers`).

### 3.7 No tests

There are zero unit, integration, or e2e tests. For a small site this is defensible, but the pieces most worth testing already exist:

- `sanitizeMessages` — pure function with several branches; ideal for Vitest.
- The chat happy-path and error-path — Playwright with a mocked `/api/chat`.

Remedial action:

- Add `vitest` + a single `sanitizeMessages.test.ts` to seed the test culture.
- Add `playwright` smoke test that loads `/` and asserts the page renders and the chat form is interactive.

### 3.8 No `next.config.{js,mjs,ts}`

Default config is fine for a brochure site, but there is no place to set:

- `images.remotePatterns` (you'll want this when adding portfolio screenshots).
- `headers()` for security headers (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- `redirects()` / `rewrites()`.

Remedial action:

- Add a `next.config.mjs` that at minimum sets a strict-but-workable CSP plus `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: ()`.

### 3.9 Accessibility: heading order and skip target

The hero `<h1>` is great, but inside `Section` every block uses `<h2>` and the journey list uses `<h3>` for a role title that visually looks like a list item, not a sub-heading. Screen-reader users navigating by heading will hear a long flat list of `<h3>`s with the company name appearing as small caps text, not as a heading.

Remedial actions:

- Audit headings with the Accessibility tab in DevTools.
- Consider promoting the role to the `<h3>` and demoting the company line to plain text (already the case visually); fine as-is, but verify with a screen reader.

### 3.10 No `viewport` or theme-color metadata

`layout.tsx` exports `metadata` but no `viewport`. With Next 13+/14+ the `viewport` export is preferred for `theme-color`, `colorScheme`, and explicit width settings. The site is dark; without `colorScheme: "dark"` Safari may render the URL bar in light mode briefly.

### 3.11 No favicon / public assets

There is no `public/` directory, so there is no favicon, no `apple-touch-icon`, no `og-image`, no `robots.txt`, no `sitemap.xml`. For a personal brand site this matters.

Remedial actions:

- Add `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png` (Next will wire them in automatically).
- Add `app/robots.ts` and `app/sitemap.ts` (typed Next 13+ helpers).
- Add `metadata.openGraph` and `metadata.twitter` to `layout.tsx` so links shared on social have a card.

---

## 4. Low / nitpick

- `clsx` is imported but only used twice (`landing-page.tsx`). Consider whether it's worth the dependency, or use a small local helper.
- `framer-motion` is a heavy dependency (~50 KB gzipped) used only for fade-in. The CSS `@starting-style` rule or a few `@keyframes` would do the same work without the bundle cost.
- `runtime = "nodejs"` is the default in App Router, the export is redundant. Keep it only if you specifically want to prevent automatic edge migration.
- `digital-twin-chat.tsx` line 113 — the filter walks `nextMessages` on every send. Cheap, but a `useMemo` over `messages` keyed `[messages]` would express intent better.
- The `metrics` array contains `{ label, value }` pairs with marketing numbers ("30+", "8+", "10+"). Consider whether these are accurate enough to commit to publicly; review with the user.
- README mentions `cp .env.example .env` but the `.env` file already exists in the working tree. Worth noting in setup that you should not overwrite an existing `.env`.
- `Profile.pdf` (54 KB) is checked into the project root with no `.gitignore` entry for binary CV-style files. Either intentional (then mention it in README) or accidental.
- `tutorial.md` (27 KB) is also at the project root with no link from the README. Either link it or move it under `docs/`.
- `tsconfig.json` `target: "ES2017"` is older than necessary for Node 20+/modern browsers; bumping to `ES2022` reduces emitted polyfills.

---

## 5. Things done well

To balance the picture:

- Project layout (App Router under `src/app`, components under `src/components`, data under `src/data`, lib under `src/lib`, alias `@/*`) is clean and idiomatic for Next 14+/15+.
- Strict TypeScript is enabled; the only `as` cast (`message as Partial<ChatMessage>`) is in a guarded type predicate, which is the correct pattern.
- The system prompt in `digital-twin-context.ts` is well-thought-out: first-person voice, explicit refusal to invent facts, refusal to leak system prompt. This is much better than the typical first-pass prompt.
- The chat input has proper `<label htmlFor>`, focus-visible outlines on every interactive element, and a "Skip to main content" link — accessibility intent is clearly there.
- `ReactMarkdown` is locked down with a custom component map rather than rendering raw HTML; XSS risk from model output is low.
- `sanitizeMessages` defensively whitelists the role and length-bounds the content before forwarding — better than most LLM proxy code I see.
- `.env` is git-ignored and `.env.example` exists with the right variable name.
- Tailwind v4 + PostCSS plugin is configured with the new official syntax.
- `prefers-reduced-motion` is respected in `globals.css`.

---

## 6. Suggested remediation order

If only a few things are done, do them in this order:

1. **Rotate the OpenRouter API key** (it has been transmitted off-device during this review).
2. Set a **spend cap** on the OpenRouter key.
3. Fix the **package.json versions** so a fresh `npm ci` works on another machine.
4. Add **rate limiting + origin allow-list** on `/api/chat` before publishing the site.
5. Restore real **error logging** in the API route.
6. Add **auto-scroll** and **Cmd/Ctrl+Enter** to the chat — small, big UX win.
7. Add **streaming** responses from the model.
8. Add a **public/** folder with favicon and OG image, and a `viewport` export in `layout.tsx`.
9. Add a single **vitest** test for `sanitizeMessages` to seed the test culture.
10. Decouple **profile schema** from the prompt builder (typed schema or generic walker).

Everything else in section 3–4 is polish that can be done as the site grows.
