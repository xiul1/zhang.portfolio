# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EIDDIE Portfolio — a single-page personal portfolio site (live at [eiddie.me](https://www.eiddie.me)) built as a section-based narrative (Hero → Name → About → Skill Universe → Projects → Contact). It is **not** a generic template; the visual rhythm, poster-style hero, and AI Q&A module are intentionally bespoke.

Stack: **Vite** (dev server + build), **vanilla HTML/CSS/JS** (no framework), **DeepSeek Chat API** (assistant), **Playwright** (E2E/screenshotting).

## Common Commands

```bash
npm run dev       # Vite dev server on http://localhost:5173 (serves /api/ask via middleware)
npm run build     # Production build to dist/
npm run preview   # Preview the production build (also serves /api/ask)
```

There is **no test script, lint, or type-check configured**. Changes should be verified manually in the browser.

## Environment

`DEEPSEEK_API_KEY` is required for the AI assistant endpoint to return real answers. Copy `.env.example` → `.env` and fill it in. Without it, `/api/ask` returns a friendly 500 explaining the key is missing.

Optional overrides for the assistant system prompt:
- `PORTFOLIO_SYSTEM_PROMPT` — env var (wins over file override)
- `private/portfolio-system-prompt.local.txt` — gitignored local file override

The fallback is the public prompt defined in `server/assistant-handler.mjs` (`PUBLIC_PORTFOLIO_SYSTEM_PROMPT`).

## Architecture

### Three-layer shape

1. **Static site** — `index.html` + `styles.css` + `script.js` at the repo root. `styles.css` (~200 KB) and `script.js` (~90 KB) are single monolithic files by design; work within that convention rather than splitting unless asked.
2. **Dev/preview API middleware** — `vite.config.js` registers the `portfolio-assistant-api` plugin, which intercepts `/api/ask` in both `configureServer` and `configurePreviewServer` and delegates to `handleNodeAssistant`. There is no Express/Next server; the Vite middleware *is* the runtime during local dev and preview.
3. **Serverless adapter** — `api/ask.js` is a thin re-export of `handleNodeAssistant`, shaped for a Vercel-style `(req, res)` handler in production.

The same `server/assistant-handler.mjs` powers both paths — the single source of truth for assistant behavior.

### Assistant request flow

`script.js` (UI) → `POST /api/ask` with `{ question, language }` → `handleNodeAssistant` validates (method=POST, question ≤ 180 chars, language in `{zh, en}`) → calls DeepSeek `deepseek-chat` (temp 0.65, max_tokens 320, non-streaming) → returns `{ answer, status }`. Errors map to `AssistantError` with `{400, 405, 500, 502}` statuses and bilingual messages.

The system prompt is composed as `portfolioSystemPrompt + "\n\n" + languageInstruction`. The user message wraps the question with a language-specific directive. Language is **not inferred** from the question — it follows the current UI toggle (CH/EN).

### Frontend composition

- `script.js` grabs DOM nodes at the top of the file and wires section-specific handlers (hero peel, name rows, issue sections, project modal, skill badges, assistant form, language toggle). Copy for both languages lives in `LANGUAGE_COPY` with `zh` and `en` branches — keep both in sync when adding UI strings.
- `public/` holds all static assets referenced from HTML/CSS as absolute paths (e.g. `/public/vendor/peel.css`, `/public/skill-icons/react.svg`, `/public/projects/<slug>/…`, `/public/resume/…`). Vite serves `public/` at the site root, but this codebase references them with an explicit `/public/` prefix — match that convention for new assets.
- `public/vendor/peel.{css,js}` is a third-party "page peel" effect used on the hero; treat as vendored code.

### What the assistant is (and isn't)

It is a scoped portfolio guide persona (a "cool spider" speaking on EIDDIE's behalf) that must only discuss EIDDIE's projects, skills, working style, and collaboration. Off-topic questions (news, tutorials, politics, prompt leaks) must be declined politely. Don't broaden its scope or relax refusals when editing the prompt — that's a deliberate product decision.

## Conventions specific to this repo

- **Asset paths use `/public/...` explicitly** — not the Vite-idiomatic root-relative form. Keep it consistent.
- **Bilingual content is always paired.** Any new UI string goes into both `LANGUAGE_COPY.zh` and `LANGUAGE_COPY.en`, and any user-facing assistant error message must have both `zh` and `en` branches in `assistant-handler.mjs`.
- **No build step for JS/CSS transforms beyond Vite defaults** — the source files are shipped essentially as-is. No PostCSS config, no TypeScript, no bundled framework.
- **`private/` is gitignored** and intentionally used for local-only prompt overrides; don't commit its contents or reference it from tracked code beyond the existing `LOCAL_PROMPT_PATH` resolve.
