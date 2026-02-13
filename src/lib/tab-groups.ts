import {
	getStore,
	saveProject,
	setActiveProjectId,
	setSwitching,
} from "./storage.js";
import {
	createGroupWithTabs,
	getLiveGroups,
	getTabsInGroup,
	removeGroup,
	snapshotGroup,
} from "./tabs.js";
import type { Project, SavedGroup, SavedTab } from "./types.js";

/** Capture all current tab groups as a new or updated project */
export async function captureProject(
	name: string,
	existingId?: string,
): Promise<Project> {
	const liveGroups = await getLiveGroups();
	const groups: SavedGroup[] = [];

	for (const lg of liveGroups) {
		const tabs = await getTabsInGroup(lg.id);
		groups.push(snapshotGroup(lg, tabs));
	}

	const now = Date.now();
	const project: Project = {
		id: existingId ?? crypto.randomUUID(),
		name,
		groups,
		createdAt: existingId
			? ((await findProject(existingId))?.createdAt ?? now)
			: now,
		updatedAt: now,
	};

	await saveProject(project);
	await setActiveProjectId(project.id);
	return project;
}

/** Restore a project's tab groups in the browser */
export async function restoreProject(projectId: string): Promise<void> {
	const project = await findProject(projectId);
	if (!project) throw new Error(`Project not found: ${projectId}`);

	for (const group of project.groups) {
		await createGroupWithTabs(group);
	}

	await setActiveProjectId(projectId);
}

/** Close all current tab groups (used before switching projects) */
export async function closeAllGroups(): Promise<void> {
	const liveGroups = await getLiveGroups();
	for (const group of liveGroups) {
		await removeGroup(group.id);
	}
}

/** Switch from current groups to a target project */
export async function switchToProject(projectId: string): Promise<void> {
	await setSwitching(true);
	try {
		await closeAllGroups();
		await restoreProject(projectId);
	} finally {
		await setSwitching(false);
	}
}

/** Auto-save: update the active project with current live groups */
export async function autoSaveActiveProject(): Promise<Project | null> {
	const store = await getStore();
	if (!store.activeProjectId) return null;

	const project = store.projects.find((p) => p.id === store.activeProjectId);
	if (!project) return null;

	return captureProject(project.name, project.id);
}

/** Find a project by ID */
async function findProject(id: string): Promise<Project | undefined> {
	const store = await getStore();
	return store.projects.find((p) => p.id === id);
}

/** Count total tabs across all groups in a project */
export function countTabs(project: Project): number {
	return project.groups.reduce((sum, g) => sum + g.tabs.length, 0);
}

/** Tab-level diff of a group */
export interface GroupDiff {
	title: string;
	color: string;
	status: "added" | "removed" | "modified" | "unchanged";
	addedTabs: SavedTab[];
	removedTabs: SavedTab[];
}

/** Full diff between saved and live state */
export interface ProjectDiff {
	groups: GroupDiff[];
	totalAdded: number;
	totalRemoved: number;
	hasChanges: boolean;
}

/** Diff saved project groups against live groups */
export function diffGroups(
	saved: SavedGroup[],
	live: SavedGroup[],
): ProjectDiff {
	const savedMap = new Map(saved.map((g) => [g.title, g]));
	const liveMap = new Map(live.map((g) => [g.title, g]));
	const groups: GroupDiff[] = [];
	let totalAdded = 0;
	let totalRemoved = 0;

	// Groups in live but not saved (new groups)
	for (const [title, liveGroup] of liveMap) {
		if (!savedMap.has(title)) {
			groups.push({
				title,
				color: liveGroup.color,
				status: "added",
				addedTabs: liveGroup.tabs,
				removedTabs: [],
			});
			totalAdded += liveGroup.tabs.length;
		}
	}

	// Groups in saved but not live (removed groups)
	for (const [title, savedGroup] of savedMap) {
		if (!liveMap.has(title)) {
			groups.push({
				title,
				color: savedGroup.color,
				status: "removed",
				addedTabs: [],
				removedTabs: savedGroup.tabs,
			});
			totalRemoved += savedGroup.tabs.length;
		}
	}

	// Groups in both — diff tabs by URL
	for (const [title, savedGroup] of savedMap) {
		const liveGroup = liveMap.get(title);
		if (!liveGroup) continue;

		const savedUrls = new Set(savedGroup.tabs.map((t) => t.url));
		const liveUrls = new Set(liveGroup.tabs.map((t) => t.url));

		const addedTabs = liveGroup.tabs.filter((t) => !savedUrls.has(t.url));
		const removedTabs = savedGroup.tabs.filter((t) => !liveUrls.has(t.url));

		if (addedTabs.length > 0 || removedTabs.length > 0) {
			groups.push({
				title,
				color: liveGroup.color,
				status: "modified",
				addedTabs,
				removedTabs,
			});
			totalAdded += addedTabs.length;
			totalRemoved += removedTabs.length;
		}
	}

	return {
		groups,
		totalAdded,
		totalRemoved,
		hasChanges: groups.length > 0,
	};
}
