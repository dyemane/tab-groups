# Project Tab Groups

Chrome extension that saves, restores, and switches between named tab group configurations per project.

Working on 3 projects with 5-8 tabs each in color-coded groups? One click to switch between them. Groups persist across browser restarts (Chrome loses group IDs on restart — this extension re-creates them by title + color).

## Features

- **Save** current tab groups as a named project
- **Restore** a project's groups with all tabs, colors, and titles
- **Switch** between projects (closes current groups, opens target)
- **Auto-save** active project when groups change
- **Persist** across browser restarts (Chrome tab group IDs don't survive restarts)
- **Export/Import** — backup all projects to JSON, import on another machine or share
- **Keyboard shortcuts** — cycle through projects without opening the popup
- **Search** across all projects by tab title or URL with highlighted matches
- **Tab count badge** on extension icon showing active project's tab count
- **Drag-and-drop** reorder projects in the popup
- **Diff view** — see what changed since last save before clicking Update

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+Right` | Switch to next project |
| `Alt+Shift+Left` | Switch to previous project |
| `Alt+Shift+S` | Save/update current project |

Customize shortcuts at `chrome://extensions/shortcuts`.

## Install

```bash
npm install
npm run build
```

Then load `dist/` as an unpacked extension in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` directory

## Development

```bash
npm run dev      # Watch mode (rebuilds on changes)
npm test         # Run unit tests (53 tests)
npm run lint     # Biome linting
npm run lint:fix # Auto-fix lint issues
```

## How It Works

1. **Save**: Reads all `chrome.tabGroups` and their tabs → stores as a `Project` in `chrome.storage.local`
2. **Restore**: For each saved group: creates tabs → groups them → applies title, color, collapsed state
3. **Switch**: Closes current project's groups → restores target project
4. **Auto-save**: Background service worker listens to `tabGroups.onUpdated` / `onRemoved`, debounce-saves the active project
5. **Export**: Serializes all projects to versioned JSON with validation
6. **Import**: Validates JSON structure, merges new projects (skips duplicates by ID)
7. **Shortcuts**: `chrome.commands` API routes keyboard shortcuts to the background service worker, which cycles through saved projects

## Stack

Preact + Vite + TypeScript + MV3 + Biome + Vitest

## Permissions

- `tabGroups` — read and manage tab groups
- `tabs` — create, query, group, and remove tabs
- `storage` — persist projects in chrome.storage.local

## Roadmap

### Done
- [x] Save/restore/switch tab groups per project
- [x] Auto-save active project on group changes
- [x] Persist across browser restarts (match by title+color)
- [x] Export/import projects as JSON
- [x] Keyboard shortcuts (next/prev project, save)
- [x] Search across all projects (tab titles/URLs)
- [x] Tab count badge on extension icon
- [x] Drag-and-drop reorder projects
- [x] Diff view (saved vs live comparison)

### Next
- [ ] Project templates (pre-loaded tab sets for common workflows)
