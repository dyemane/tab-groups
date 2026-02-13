# Project Tab Groups

Chrome extension — save, restore, and switch tab group configurations per project.

## Quick Start

```bash
npm install
npm run build    # TypeScript check + Vite build
npm run dev      # Watch mode
npm test         # Vitest unit tests (43 tests)
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
│   ├── App.tsx                  # Root component (export/import controls here)
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
│   └── service-worker.ts        # Auto-save, keyboard shortcut handlers
├── lib/
│   ├── storage.ts               # chrome.storage.local get/set wrapper
│   ├── export-import.ts         # Export/import JSON, validation, file download
│   ├── tab-groups.ts            # Save/restore/diff group logic
│   ├── tabs.ts                  # Tab query/create/group/ungroup helpers
│   └── types.ts                 # Shared TypeScript types
└── __tests__/
    ├── storage.test.ts
    ├── tab-groups.test.ts
    ├── tabs.test.ts
    └── export-import.test.ts
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

// Export format (versioned for forward compatibility)
interface ExportData {
  version: 1;
  exportedAt: string;      // ISO 8601
  projects: Project[];
}
```

Stored in `chrome.storage.local` under keys `"projects"` and `"activeProjectId"`.

### Key Flows

1. **Save** — `chrome.tabGroups.query({})` → for each group, `chrome.tabs.query({groupId})` → build Project → save to storage
2. **Restore** — For each SavedGroup: `chrome.tabs.create()` per tab → `chrome.tabs.group({tabIds})` → `chrome.tabGroups.update(groupId, {title, color, collapsed})`
3. **Switch** — Close current project groups → restore target project
4. **Auto-save** — Background service worker listens to `tabGroups.onUpdated`/`onRemoved`, debounce-saves active project (2s delay)
5. **Export** — `exportAllProjects()` serializes all projects to versioned JSON. `downloadJson()` triggers browser file download.
6. **Import** — File input reads JSON → `parseExportData()` validates structure (version, project fields, group colors, tab fields) → `importProjects()` merges or replaces
7. **Keyboard shortcuts** — `chrome.commands.onCommand` in service worker cycles through projects or triggers save

### Important: Group IDs Reset on Restart

Chrome tab group IDs are ephemeral — they reset when the browser restarts. This extension matches groups by title + color, not by ID. The `findMatchingGroup()` helper in `tabs.ts` handles this.

## Keyboard Shortcuts

Defined in `manifest.json` under `commands`:

| Command | Default Key | Action |
|---------|-------------|--------|
| `switch-next-project` | `Alt+Shift+Right` | Switch to next project |
| `switch-prev-project` | `Alt+Shift+Left` | Switch to previous project |
| `save-current-project` | `Alt+Shift+S` | Save/update active project |

Users can customize at `chrome://extensions/shortcuts`. The handlers live in `service-worker.ts`.

## Export/Import

The export format is versioned (`version: 1`) so future changes can be handled with migrations. The `parseExportData()` function validates every field down to individual tabs, rejecting invalid colors, missing URLs, etc.

Import has two modes:
- **merge** (default) — adds only projects with new IDs, skips duplicates
- **replace** — overwrites all existing projects with imported data

## Chrome APIs

```
chrome.tabGroups: query(), update(), onCreated, onUpdated, onRemoved
chrome.tabs: query({groupId}), create(), group(), ungroup(), remove()
chrome.storage.local: get(), set() — 10MB limit, persists across sessions
chrome.commands: onCommand — keyboard shortcut handling
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
- `storage.test.ts` — CRUD operations on chrome.storage.local (13 tests)
- `tabs.test.ts` — snapshot/match helpers, pure functions (9 tests)
- `tab-groups.test.ts` — countTabs, diffProjects, pure functions (8 tests)
- `export-import.test.ts` — parse validation, export format, merge/replace import (13 tests)

Run: `npm test` (43 tests total)

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

## Roadmap

### Done
- [x] Save/restore/switch tab groups per project
- [x] Auto-save active project on group changes
- [x] Persist across browser restarts (match by title+color)
- [x] Export/import projects as JSON (versioned format with validation)
- [x] Keyboard shortcuts (next/prev project, save)

### Next
- [ ] Drag-and-drop reorder groups and tabs in popup
- [ ] Search across all projects (fuzzy match tab titles/URLs)
- [ ] Project templates (pre-loaded tab sets for common workflows)
- [ ] Tab count badge on extension icon
- [ ] Diff view (show what changed since last save)
