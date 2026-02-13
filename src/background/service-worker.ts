import { getActiveProjectId } from "../lib/storage.js";
import { autoSaveActiveProject } from "../lib/tab-groups.js";

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
