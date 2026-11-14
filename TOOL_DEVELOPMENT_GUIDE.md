# SANDO Tool Development Guide

A tool is one registry entry plus (when it is operational) one component. Once registered it appears
automatically in the right profession's dashboard, the sidebar, onboarding results, the landing
ecosystem and the assistant. Nothing in `src/pages/` needs to change.

```
src/tools/registry.ts      the registry: ToolDef, registerTool, toolsFor, buildProfile
src/tools/demo.ts          Demo Mode data, templates and assistant replies (no AI calls)
src/tools/shared.tsx       SavedList, useOpenSaved, DemoNote, useFlash
src/tools/<YourTool>.tsx   the tool UI
src/components/Agent.tsx   useAgentBridge / useAgent
server/index.js            TASKS (AI tasks) and PATCH_KEYS (fields the assistant may edit)
```

## 1. Add a new tool — or promote a preview

Eight tools are already registered with `status: 'preview'`. To make one real, build its component
and change two lines in its registry entry (`status: 'ready'`, `component: lazy(...)`).

## 2. Register it

In `src/tools/registry.ts`, use `prof('<profession>', {...})` or `shared({...})`:

```ts
prof('sales', {
  id: 'followup-manager',                 // unique, kebab-case; also the URL /app/tool/<id>
  name: 'Customer Follow-up Manager',     // internal English name
  label: l('مدير متابعة العملاء', 'Customer Follow-up Manager'),
  description: l('…', '…'),
  icon: Users,                            // any lucide-react icon
  status: 'ready',                        // 'preview' = blueprint page only, never fakes results
  inputs: [l('قائمة العملاء', 'Customer list')],     // input structure
  outputs: [l('أولويات المتابعة', 'Follow-up priorities')], // output structure
  component: lazy(() => import('./FollowupManager')),
  aiTask: undefined,                      // optional: server task used for Live AI generation
  ...agent('followup-manager'),           // wires demo executor + suggestion chips (step 4)
})
```

`category` and `profession` are filled in by `prof()` / `shared()`. Professions are
`marketing | sales | admin | education`. To have onboarding rank the tool, reference its id from a
task in `src/lib/professions.ts` (`tasks[].tool`) or a goal (`goals[].tool`).

## 3. Build its UI

Create `src/tools/FollowupManager.tsx` with a default export taking `ToolProps`:

```tsx
export default function FollowupManager({ autoSample }: ToolProps) {
  const d = useDict(D)                       // step 6
  const [state, setState] = useState(initial)
  useEffect(() => { if (autoSample) setState(sample(lang)) }, [autoSample])  // used by /demo
  ...
}
```

Use the primitives in `src/components/ui.tsx` (`Button`, `Card`, `Field`, `inputCls`, `download`,
`printNode`, `copyText`). Style with the theme tokens (`bg-surface`, `text-muted`, `border-line`,
`accent-bg`, `accent-text`) so dark/light themes and profession accents work. Use logical utilities
(`ms-`, `pe-`, `text-start`, `border-s`) — never `ml-`/`left-` — so RTL and LTR both lay out correctly.
Do all arithmetic in JavaScript; never ask a model to calculate.

## 4. Connect it to the agent

Publish the tool's state, and optionally a way to apply confirmed edits:

```tsx
const state = useMemo(() => ({ customers, overdue }), [customers, overdue])
useAgentBridge('followup-manager', state, patch => {
  if (typeof patch.message === 'string') setDraft(patch.message)
})
```

- Omit the third argument if the assistant should only explain, not edit.
- Trigger the assistant from a button: `agent.ask('draft', d.draftLabel)` (`const agent = useAgent()`).
- For Live AI edits, whitelist the editable keys in `server/index.js`:
  `PATCH_KEYS['followup-manager'] = { message: 'text' }` (`'text'` = string, `'list'` = string[]).
  Anything outside the whitelist is dropped by the server, and the user must still press Apply.

## 5. Add demo logic

In `src/tools/demo.ts`:

```ts
agentSuggestions['followup-manager'] = [{ id: 'draft', label: l('اكتب رسالة متابعة', 'Draft a follow-up') }]
agentDemo.tools['followup-manager'] = (intent, state, lang) =>
  intent === 'draft' ? { message: '…', patch: { message: '…' } } : { message: '…' }
```

A demo executor returns `{ message, patch?, next? }` (`next` = a tool id to recommend). Keep sample
data here too. If the tool generates content, show `<DemoNote />` whenever the output came from a
template rather than a model. For Live generation add a task to `TASKS` in `server/index.js`
(build a prompt, then validate the JSON in `check`) and call `aiRequest('<task>', lang, payload)`
after checking `useAiStatus().live`; on failure fall back to the demo output and say so.

## 6. Support translations

Every visible string lives in a dictionary with identical `ar` and `en` shapes:

```ts
const D = { ar: { title: 'المتابعات' }, en: { title: 'Follow-ups' } }
const d = useDict(D)            // d.title
```

Registry fields use `l('عربي', 'English')` and render with `tr(tool.label)`. Format with `fmtNum`,
`fmtMoney`, `fmtDate`. Wrap numbers, codes and emails in `dir="ltr"`.

## 7. Save outputs

```tsx
const id = saveOutput('followup-manager', title, data, existingId)   // returns the saved id
logActivity('followup-manager', l('حفظ خطة متابعة', 'Saved a follow-up plan'))
useOpenSaved<Data>('followup-manager', (data, id) => { setState(data); setSavedId(id) })  // handles ?open=<id>
<SavedList<Data> toolId="followup-manager" activeId={savedId} onOpen={...} />
```

Saved outputs and activity then show up on the dashboard automatically.

## 8. Test it

1. `npm run typecheck` and `npm run build`.
2. `npm start`, open `/app/tool/<id>` in Arabic and English, in dark and light themes, at phone width.
3. With no API key: confirm the tool works end to end and demo output is labelled.
4. With a key: confirm the Live path, then stop the server mid-request to see the fallback message.
5. Save, refresh the page, reopen from the dashboard's saved list.
6. Open the assistant, run each suggestion chip, apply and dismiss a proposal.
