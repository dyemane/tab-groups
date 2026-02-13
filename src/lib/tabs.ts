import type { SavedGroup, SavedTab, TabGroupColor } from "./types.js";

/** Get all tab groups in the current window */
export async function getLiveGroups(): Promise<chrome.tabGroups.TabGroup[]> {
	return chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
}

/** Get all tabs belonging to a specific group */
export async function getTabsInGroup(
	groupId: number,
): Promise<chrome.tabs.Tab[]> {
	return chrome.tabs.query({ groupId });
}

/** Get all ungrouped tabs in the current window */
export async function getUngroupedTabs(): Promise<chrome.tabs.Tab[]> {
	return chrome.tabs.query({
		windowId: chrome.windows.WINDOW_ID_CURRENT,
		groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
	});
}

/** Create tabs and group them, returning the new group ID */
export async function createGroupWithTabs(group: SavedGroup): Promise<number> {
	const tabIds: number[] = [];

	for (const tab of group.tabs) {
		const created = await chrome.tabs.create({
			url: tab.url,
			pinned: tab.pinned,
			active: false,
		});
		if (created.id != null) {
			tabIds.push(created.id);
		}
	}

	if (tabIds.length === 0) return -1;

	const groupId = await chrome.tabs.group({ tabIds });
	await chrome.tabGroups.update(groupId, {
		title: group.title,
		color: group.color,
		collapsed: group.collapsed,
	});

	return groupId;
}

/** Remove all tabs in a group (which also removes the group) */
export async function removeGroup(groupId: number): Promise<void> {
	const tabs = await getTabsInGroup(groupId);
	const tabIds = tabs.map((t) => t.id).filter((id): id is number => id != null);
	if (tabIds.length > 0) {
		await chrome.tabs.remove(tabIds);
	}
}

/** Snapshot a live Chrome tab group into our SavedGroup format */
export function snapshotGroup(
	group: chrome.tabGroups.TabGroup,
	tabs: chrome.tabs.Tab[],
): SavedGroup {
	return {
		title: group.title ?? "",
		color: group.color as TabGroupColor,
		collapsed: group.collapsed,
		tabs: tabs.map(snapshotTab),
	};
}

/** Snapshot a live Chrome tab into our SavedTab format */
export function snapshotTab(tab: chrome.tabs.Tab): SavedTab {
	return {
		url: tab.url ?? tab.pendingUrl ?? "",
		title: tab.title ?? "",
		pinned: tab.pinned ?? false,
	};
}

/** Activate (focus) a tab by URL in the current window */
export async function activateTabByUrl(url: string): Promise<boolean> {
	const tabs = await chrome.tabs.query({
		windowId: chrome.windows.WINDOW_ID_CURRENT,
	});
	const match = tabs.find((t) => t.url === url || t.pendingUrl === url);
	if (match?.id != null) {
		await chrome.tabs.update(match.id, { active: true });
		return true;
	}
	return false;
}

/** Find a live group matching by title and color (since group IDs reset on restart) */
export function findMatchingGroup(
	liveGroups: chrome.tabGroups.TabGroup[],
	title: string,
	color: TabGroupColor,
): chrome.tabGroups.TabGroup | undefined {
	return liveGroups.find((g) => g.title === title && g.color === color);
}
