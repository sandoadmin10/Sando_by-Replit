# Professional Marketer — architecture

```
src/agents/marketing/
  skills/index.js     the 8 skills (shared by the browser UI and the Node agent)
  demo/coffee.js      sample project + scripted Demo Mode run (all data labelled as sample)
  files.ts            attachment intelligence: signature check, PDF/DOCX/XLSX/CSV/TXT/image extraction
  memory.ts           Marketing Memory: projects, records, deliverables in IndexedDB
  run.ts              streams a run from POST /api/agent (NDJSON), cancellable
  ui/MarketerStudio   command bar, skill cards, task sheets, activity, deliverables, memory
  ui/DocView          deliverable renderer/editor + PDF / Markdown / CSV export
server/agent.js       the agent loop, tool registry, SSRF-safe fetching, deterministic metrics
```

## How a run works

1. The browser sends the objective, extracted attachment content (never the raw files), the selected
   project's memory and any skill the user launched from.
2. `server/agent.js` gives the model the **skill catalog** (one-line summaries) and the **tool contracts**.
   The model replies with JSON: a one-line plan plus up to 4 tool calls, or `final`.
3. Tools run on the server; their results go back into the next step. The model loads a skill's full
   method with `load_skill` only when it decides to use it (progressive disclosure).
4. Up to 12 steps, 8-minute ceiling. Transient failures retry with backoff; failed tools return an error
   the model can route around; completed deliverables are kept if the run ends early.
5. Every step streams to the UI as an event (`plan`, `tool`, `artifact`, `memory`, `done`) — the activity
   panel shows only real events.

The agent has no shell, filesystem or secret access. It cannot send messages, publish or spend money:
outreach and campaigns are produced as drafts for the user.

## Tools

| Tool | What it really does |
| --- | --- |
| `load_skill` | Returns the skill's detailed method and quality bar |
| `fetch_public_page` | Fetches a public page (http/https, ports 80/443, private/internal IPs blocked, redirects re-checked, 15 s timeout, 1.5 MB cap) and extracts title, meta, headings, CTAs, links, forms (never submitted), contact, prices, tracking scripts in static HTML, text |
| `search_web` | Brave Search API — only when `BRAVE_API_KEY` is set; otherwise returns a clear error |
| `read_attachment` / `search_in_attachments` | Chunked reading and evidence search with row/line references |
| `analyze_table` | Exact profile of a CSV/Excel table |
| `calculate_marketing_metrics` | Exact CTR, CPC, CPM, CPA, ROAS, conversion rate (total + per group) and anomaly flags |
| `view_image` | Vision through the API providers; refuses honestly when the connection has no vision (Claude/Cursor CLI sign-in) |
| `retrieve_project_memory` / `save_project_memory` | Read the selected project's memory; propose durable records (stored in the browser) |
| `create_deliverable` | Validated document blocks → editable deliverable with PDF export |
| `ask_user` | Ends the run with a question when essential information is missing |

## Adding a ninth skill

1. Append an object to `skills/index.js`: `id`, `icon` (a lucide icon name present in `ICONS` in
   `ui/MarketerStudio.tsx`), bilingual `label` / `short` / `examples` / `inputs` / `outputs`, the
   one-line `summary` the model sees, the detailed `guidance` it loads on demand, `fields` for the
   one-click form, `tools` and `deliverable`.
2. That's it — the card, the task form and the agent's skill catalog pick it up automatically.
3. If it needs a new capability, add one entry to `TOOLS` in `server/agent.js` (`phase`, `args`, `desc`,
   `run`) and a label in the `tools` dictionary of `MarketerStudio.tsx`. Keep `run` deterministic,
   bounded and side-effect free; anything that sends, publishes or deletes must go through a user approval.

## Other agents on the same engine

`server/agent.js` defines `AGENTS` (persona, skill catalog, allowed tools, demo replay). The Professional Sales
Employee (`src/agents/sales/`) is the second agent: its skills live in `src/agents/sales/skills/index.js`, its UI in
`src/agents/sales/ui/SalesStudio.tsx`, and it reuses the composer, run view, skill sheet and deliverable viewer from
this folder. A new agent = a skills file + an `AGENTS` entry + a UI (or reuse `MarketerStudio`'s parts).

## Demo Mode

With no AI provider configured, "Try the coffee brand scenario" replays a fixed plan, but each tool call
really runs on the sample files (the metrics and counts in its reports come from those runs). All sample
content is labelled. With Live AI, the same scenario runs through the real agent instead.
