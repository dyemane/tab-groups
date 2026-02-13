import { getStore, saveProject, setActiveProjectId } from "./storage.js";
import {
	createGroupWithTabs,
	getLiveGroups,
	getTabsInGroup,
	removeGroup,
	snapshotGroup,
} from "./tabs.js";
import type { Project, SavedGroup } from "./types.js";

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
	await closeAllGroups();
	await restoreProject(projectId);
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

/** Diff two projects to see what changed */
export function diffProjects(
	a: Project,
	b: Project,
): { added: string[]; removed: string[]; modified: string[] } {
	const aGroups = new Map(a.groups.map((g) => [g.title, g]));
	const bGroups = new Map(b.groups.map((g) => [g.title, g]));

	const added: string[] = [];
	const removed: string[] = [];
	const modified: string[] = [];

	for (const [title] of bGroups) {
		if (!aGroups.has(title)) added.push(title);
	}

	for (const [title] of aGroups) {
		if (!bGroups.has(title)) removed.push(title);
	}

	for (const [title, aGroup] of aGroups) {
		const bGroup = bGroups.get(title);
		if (bGroup && !groupsEqual(aGroup, bGroup)) {
			modified.push(title);
		}
	}

	return { added, removed, modified };
}

function groupsEqual(a: SavedGroup, b: SavedGroup): boolean {
	if (a.color !== b.color || a.collapsed !== b.collapsed) return false;
	if (a.tabs.length !== b.tabs.length) return false;
	return a.tabs.every(
		(t, i) =>
			t.url === b.tabs[i].url &&
			t.title === b.tabs[i].title &&
			t.pinned === b.tabs[i].pinned,
	);
}
