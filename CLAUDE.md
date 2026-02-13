# Project Tab Groups

Chrome extension — save, restore, and switch tab group configurations per project.

## Quick Start

```bash
npm install
npm run build    # TypeScript check + Vite build
npm run dev      # Watch mode
npm test         # Vitest unit tests
npm run lint     # Biome check
```

Load `dist/` as unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

## Architecture

MV3 Chrome extension with Preact popup UI + background service worker.

### File Structure

```
src/
├── popup/                       # Extension popup (main UI)
│   ├── index.html               # Entry HTML
│   ├── index.tsx                # Preact render
│   ├── App.tsx                  # Root component
│   ├── components/
│   │   ├── ProjectList.tsx      # List of saved projects
│   │   ├── ProjectCard.tsx      # Single project with group summary
│   │   ├── GroupRow.tsx         # Tab group row (color dot, title, tab count)
│   │   ├── TabRow.tsx           # Individual tab within expanded group
│   │   ├── AddProjectForm.tsx   # Save current groups as new project
│   │   └── ConfirmDialog.tsx    # Delete confirmation
│   ├── hooks/
│   │   ├── useProjects.ts       # CRUD for projects in chrome.storage.local
│   │   ├── useTabGroups.ts      # Read live Chrome tab groups
│   │   └── useActiveProject.ts  # Track which project is active
│   └── styles/
│       ├── popup.css            # Layout, cards, buttons
│       └── theme.css            # CSS custom properties, dark mode
├── background/
│   └── service-worker.ts        # Group event listeners, debounced auto-save
├── lib/
│   ├── storage.ts               # chrome.storage.local get/set wrapper
│   ├── tab-groups.ts            # Save/restore/diff group logic
│   ├── tabs.ts                  # Tab query/create/group/ungroup helpers
│   └── types.ts                 # Shared TypeScript types
└── __tests__/
    ├── storage.test.ts
    ├── tab-groups.test.ts
    └── tabs.test.ts
```

### Data Model

```typescript
interface Project {
  id: string;              // crypto.randomUUID()
  name: string;            // "life-cli", "devjson"
  groups: SavedGroup[];
  createdAt: number;
  updatedAt: number;
}

interface SavedGroup {
  title: string;           // "Docs", "Code", "PRs"
  color: TabGroupColor;    // grey|blue|red|yellow|green|pink|purple|cyan
  collapsed: boolean;
  tabs: SavedTab[];
}

interface SavedTab {
  url: string;
  title: string;
  pinned: boolean;
}
```

Stored in `chrome.storage.local` under keys `"projects"` and `"activeProjectId"`.

### Key Flows

1. **Save** — `chrome.tabGroups.query({})` → for each group, `chrome.tabs.query({groupId})` → build Project → save to storage
2. **Restore** — For each SavedGroup: `chrome.tabs.create()` per tab → `chrome.tabs.group({tabIds})` → `chrome.tabGroups.update(groupId, {title, color, collapsed})`
3. **Switch** — Close current project groups → restore target project
4. **Auto-save** — Background service worker listens to `tabGroups.onUpdated`/`onRemoved`, debounce-saves active project (2s delay)

### Important: Group IDs Reset on Restart

Chrome tab group IDs are ephemeral — they reset when the browser restarts. This extension matches groups by title + color, not by ID. The `findMatchingGroup()` helper in `tabs.ts` handles this.

## Chrome APIs

```
chrome.tabGroups: query(), update(), onCreated, onUpdated, onRemoved
chrome.tabs: query({groupId}), create(), group(), ungroup(), remove()
chrome.storage.local: get(), set() — 10MB limit, persists across sessions
```

Permissions: `tabGroups`, `tabs`, `storage`

## Vite Build

Multi-entry build:
- `src/popup/index.html` → popup bundle (Preact)
- `src/background/service-worker.ts` → built separately (no Preact)

The background service worker is built via vite config as a separate entry. The manifest.json references the built output paths in `dist/`.

## Build Output → Manifest Mapping

After `npm run build`, the `dist/` folder is the extension root. The `manifest.json` at project root is copied to `dist/` by Vite's `publicDir`. Paths in manifest must match Vite output:
- `popup/index.html` → from `src/popup/index.html`
- `background/service-worker.js` → from `src/background/service-worker.ts`
- `icons/` → from `public/icons/`

## Testing

Unit tests mock `chrome.*` APIs with `vi.stubGlobal("chrome", ...)`. Tests cover:
- `storage.test.ts` — CRUD operations on chrome.storage.local
- `tabs.test.ts` — snapshot/match helpers (pure functions, no Chrome API calls)
- `tab-groups.test.ts` — countTabs, diffProjects (pure functions)

Run: `npm test`

## Stack

- Preact ^10.25 — UI framework
- Vite ^6 — build tool
- TypeScript ^5.7 — type checking
- Vitest ^3 — testing
- Biome ^1.9 — linting + formatting (tabs, double quotes, semicolons)
- @types/chrome — Chrome extension type definitions

## Style Guide

- Tabs for indentation
- Double quotes
- Semicolons always
- Preact hooks in `src/popup/hooks/`
- Chrome API wrappers in `src/lib/`
- Components get their own file, one component per file
