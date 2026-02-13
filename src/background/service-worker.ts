import { getActiveProjectId, getStore } from "../lib/storage.js";
import { autoSaveActiveProject, switchToProject } from "../lib/tab-groups.js";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

/** Debounced auto-save: waits for activity to settle before saving */
function scheduleSave() {
	if (saveTimeout) clearTimeout(saveTimeout);
	saveTimeout = setTimeout(async () => {
		saveTimeout = null;
		const activeId = await getActiveProjectId();
		if (!activeId) return;

		try {
			await autoSaveActiveProject();
		} catch (err) {
			console.error("[tab-groups] Auto-save failed:", err);
		}
	}, DEBOUNCE_MS);
}

// Listen for tab group changes
chrome.tabGroups.onCreated.addListener(() => scheduleSave());
chrome.tabGroups.onUpdated.addListener(() => scheduleSave());
chrome.tabGroups.onRemoved.addListener(() => scheduleSave());

// Listen for tab changes within groups
chrome.tabs.onCreated.addListener(() => scheduleSave());
chrome.tabs.onRemoved.addListener(() => scheduleSave());
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
	// Only save on meaningful changes (URL or title)
	if (changeInfo.url || changeInfo.title) {
		scheduleSave();
	}
});

// Listen for tabs being moved between groups
chrome.tabs.onAttached.addListener(() => scheduleSave());
chrome.tabs.onDetached.addListener(() => scheduleSave());

// --- Keyboard shortcut handlers ---

chrome.commands.onCommand.addListener(async (command) => {
	try {
		const store = await getStore();
		const { projects, activeProjectId } = store;

		if (projects.length === 0) return;

		if (
			command === "switch-next-project" ||
			command === "switch-prev-project"
		) {
			const currentIdx = activeProjectId
				? projects.findIndex((p) => p.id === activeProjectId)
				: -1;

			let nextIdx: number;
			if (command === "switch-next-project") {
				nextIdx = currentIdx + 1 >= projects.length ? 0 : currentIdx + 1;
			} else {
				nextIdx = currentIdx - 1 < 0 ? projects.length - 1 : currentIdx - 1;
			}

			await switchToProject(projects[nextIdx].id);
		} else if (command === "save-current-project") {
			await autoSaveActiveProject();
		}
	} catch (err) {
		console.error("[tab-groups] Command failed:", command, err);
	}
});
