import { getProjects, saveStore } from "./storage.js";
import type { Project, ProjectStore, SavedGroup, SavedTab } from "./types.js";

export interface ExportData {
	version: 1;
	exportedAt: string;
	projects: Project[];
}

/** Export all projects as a JSON string */
export async function exportAllProjects(): Promise<string> {
	const projects = await getProjects();
	const data: ExportData = {
		version: 1,
		exportedAt: new Date().toISOString(),
		projects,
	};
	return JSON.stringify(data, null, 2);
}

/** Export a single project as a JSON string */
export async function exportProject(projectId: string): Promise<string> {
	const projects = await getProjects();
	const project = projects.find((p) => p.id === projectId);
	if (!project) throw new Error(`Project not found: ${projectId}`);

	const data: ExportData = {
		version: 1,
		exportedAt: new Date().toISOString(),
		projects: [project],
	};
	return JSON.stringify(data, null, 2);
}

/** Parse and validate an export JSON string, returning the projects */
export function parseExportData(json: string): Project[] {
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch {
		throw new Error("Invalid JSON");
	}

	if (!data || typeof data !== "object") {
		throw new Error("Invalid export data: expected an object");
	}

	const obj = data as Record<string, unknown>;

	if (obj.version !== 1) {
		throw new Error(`Unsupported export version: ${obj.version}`);
	}

	if (!Array.isArray(obj.projects)) {
		throw new Error("Invalid export data: missing projects array");
	}

	const projects: Project[] = [];
	for (const p of obj.projects) {
		projects.push(validateProject(p));
	}

	return projects;
}

/** Import projects from JSON, merging with existing (skip duplicates by ID) */
export async function importProjects(
	json: string,
	mode: "merge" | "replace" = "merge",
): Promise<{ imported: number; skipped: number }> {
	const incoming = parseExportData(json);

	if (mode === "replace") {
		const store: ProjectStore = {
			projects: incoming,
			activeProjectId: null,
		};
		await saveStore(store);
		return { imported: incoming.length, skipped: 0 };
	}

	// Merge mode — add only projects with new IDs
	const existing = await getProjects();
	const existingIds = new Set(existing.map((p) => p.id));

	let imported = 0;
	let skipped = 0;

	for (const project of incoming) {
		if (existingIds.has(project.id)) {
			skipped++;
		} else {
			existing.push(project);
			imported++;
		}
	}

	const store: ProjectStore = {
		projects: existing,
		activeProjectId: null,
	};
	await saveStore(store);

	return { imported, skipped };
}

/** Trigger a file download in the browser */
export function downloadJson(json: string, filename: string): void {
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

// --- Validation helpers ---

function validateProject(p: unknown): Project {
	if (!p || typeof p !== "object") {
		throw new Error("Invalid project: expected an object");
	}

	const obj = p as Record<string, unknown>;

	if (typeof obj.id !== "string" || !obj.id) {
		throw new Error("Invalid project: missing id");
	}
	if (typeof obj.name !== "string" || !obj.name) {
		throw new Error("Invalid project: missing name");
	}
	if (!Array.isArray(obj.groups)) {
		throw new Error("Invalid project: missing groups array");
	}
	if (typeof obj.createdAt !== "number") {
		throw new Error("Invalid project: missing createdAt");
	}
	if (typeof obj.updatedAt !== "number") {
		throw new Error("Invalid project: missing updatedAt");
	}

	return {
		id: obj.id,
		name: obj.name,
		groups: obj.groups.map(validateGroup),
		createdAt: obj.createdAt,
		updatedAt: obj.updatedAt,
	};
}

const VALID_COLORS = new Set([
	"grey",
	"blue",
	"red",
	"yellow",
	"green",
	"pink",
	"purple",
	"cyan",
]);

function validateGroup(g: unknown): SavedGroup {
	if (!g || typeof g !== "object") {
		throw new Error("Invalid group: expected an object");
	}

	const obj = g as Record<string, unknown>;

	if (typeof obj.title !== "string") {
		throw new Error("Invalid group: missing title");
	}
	if (typeof obj.color !== "string" || !VALID_COLORS.has(obj.color)) {
		throw new Error(`Invalid group color: ${obj.color}`);
	}
	if (typeof obj.collapsed !== "boolean") {
		throw new Error("Invalid group: missing collapsed");
	}
	if (!Array.isArray(obj.tabs)) {
		throw new Error("Invalid group: missing tabs array");
	}

	return {
		title: obj.title,
		color: obj.color as SavedGroup["color"],
		collapsed: obj.collapsed,
		tabs: obj.tabs.map(validateTab),
	};
}

function validateTab(t: unknown): SavedTab {
	if (!t || typeof t !== "object") {
		throw new Error("Invalid tab: expected an object");
	}

	const obj = t as Record<string, unknown>;

	if (typeof obj.url !== "string") {
		throw new Error("Invalid tab: missing url");
	}
	if (typeof obj.title !== "string") {
		throw new Error("Invalid tab: missing title");
	}
	if (typeof obj.pinned !== "boolean") {
		throw new Error("Invalid tab: missing pinned");
	}

	return {
		url: obj.url,
		title: obj.title,
		pinned: obj.pinned,
	};
}
