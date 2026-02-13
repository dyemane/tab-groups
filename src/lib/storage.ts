import type { Project, ProjectStore } from "./types.js";

const STORAGE_KEY = "projects";
const ACTIVE_KEY = "activeProjectId";

export async function getStore(): Promise<ProjectStore> {
	const result = await chrome.storage.local.get([STORAGE_KEY, ACTIVE_KEY]);
	return {
		projects: result[STORAGE_KEY] ?? [],
		activeProjectId: result[ACTIVE_KEY] ?? null,
	};
}

export async function saveStore(store: ProjectStore): Promise<void> {
	await chrome.storage.local.set({
		[STORAGE_KEY]: store.projects,
		[ACTIVE_KEY]: store.activeProjectId,
	});
}

export async function getProjects(): Promise<Project[]> {
	const store = await getStore();
	return store.projects;
}

export async function saveProject(project: Project): Promise<void> {
	const store = await getStore();
	const idx = store.projects.findIndex((p) => p.id === project.id);
	if (idx >= 0) {
		store.projects[idx] = project;
	} else {
		store.projects.push(project);
	}
	await saveStore(store);
}

export async function deleteProject(id: string): Promise<void> {
	const store = await getStore();
	store.projects = store.projects.filter((p) => p.id !== id);
	if (store.activeProjectId === id) {
		store.activeProjectId = null;
	}
	await saveStore(store);
}

export async function getActiveProjectId(): Promise<string | null> {
	const store = await getStore();
	return store.activeProjectId;
}

export async function setActiveProjectId(id: string | null): Promise<void> {
	const store = await getStore();
	store.activeProjectId = id;
	await saveStore(store);
}
