import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteProject,
	getActiveProjectId,
	getProjects,
	getStore,
	saveProject,
	saveStore,
	setActiveProjectId,
} from "../lib/storage.js";
import type { Project, ProjectStore } from "../lib/types.js";

// Mock chrome.storage.local
const storage = new Map<string, unknown>();

const chromeMock = {
	storage: {
		local: {
			get: vi.fn(async (keys: string[]) => {
				const result: Record<string, unknown> = {};
				for (const key of keys) {
					if (storage.has(key)) {
						result[key] = storage.get(key);
					}
				}
				return result;
			}),
			set: vi.fn(async (items: Record<string, unknown>) => {
				for (const [key, value] of Object.entries(items)) {
					storage.set(key, value);
				}
			}),
		},
	},
};

vi.stubGlobal("chrome", chromeMock);

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		id: crypto.randomUUID(),
		name: "Test Project",
		groups: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	};
}

describe("storage", () => {
	beforeEach(() => {
		storage.clear();
		vi.clearAllMocks();
	});

	describe("getStore", () => {
		it("returns empty store when nothing saved", async () => {
			const store = await getStore();
			expect(store.projects).toEqual([]);
			expect(store.activeProjectId).toBeNull();
		});

		it("returns saved data", async () => {
			const project = makeProject({ name: "My Project" });
			storage.set("projects", [project]);
			storage.set("activeProjectId", project.id);

			const store = await getStore();
			expect(store.projects).toHaveLength(1);
			expect(store.projects[0].name).toBe("My Project");
			expect(store.activeProjectId).toBe(project.id);
		});
	});

	describe("saveStore", () => {
		it("persists projects and active ID", async () => {
			const project = makeProject();
			await saveStore({ projects: [project], activeProjectId: project.id });

			expect(storage.get("projects")).toEqual([project]);
			expect(storage.get("activeProjectId")).toBe(project.id);
		});
	});

	describe("getProjects", () => {
		it("returns empty array when no projects", async () => {
			const projects = await getProjects();
			expect(projects).toEqual([]);
		});

		it("returns all projects", async () => {
			const p1 = makeProject({ name: "A" });
			const p2 = makeProject({ name: "B" });
			storage.set("projects", [p1, p2]);

			const projects = await getProjects();
			expect(projects).toHaveLength(2);
		});
	});

	describe("saveProject", () => {
		it("adds new project", async () => {
			const project = makeProject({ name: "New" });
			await saveProject(project);

			const projects = storage.get("projects") as Project[];
			expect(projects).toHaveLength(1);
			expect(projects[0].name).toBe("New");
		});

		it("updates existing project by ID", async () => {
			const project = makeProject({ name: "Original" });
			storage.set("projects", [project]);
			storage.set("activeProjectId", null);

			const updated = { ...project, name: "Updated", updatedAt: Date.now() };
			await saveProject(updated);

			const projects = storage.get("projects") as Project[];
			expect(projects).toHaveLength(1);
			expect(projects[0].name).toBe("Updated");
		});
	});

	describe("deleteProject", () => {
		it("removes project by ID", async () => {
			const p1 = makeProject({ name: "Keep" });
			const p2 = makeProject({ name: "Delete" });
			storage.set("projects", [p1, p2]);
			storage.set("activeProjectId", null);

			await deleteProject(p2.id);

			const projects = storage.get("projects") as Project[];
			expect(projects).toHaveLength(1);
			expect(projects[0].name).toBe("Keep");
		});

		it("clears activeProjectId if deleting active project", async () => {
			const project = makeProject();
			storage.set("projects", [project]);
			storage.set("activeProjectId", project.id);

			await deleteProject(project.id);

			expect(storage.get("activeProjectId")).toBeNull();
		});

		it("preserves activeProjectId if deleting non-active project", async () => {
			const p1 = makeProject();
			const p2 = makeProject();
			storage.set("projects", [p1, p2]);
			storage.set("activeProjectId", p1.id);

			await deleteProject(p2.id);

			expect(storage.get("activeProjectId")).toBe(p1.id);
		});
	});

	describe("getActiveProjectId / setActiveProjectId", () => {
		it("returns null by default", async () => {
			const id = await getActiveProjectId();
			expect(id).toBeNull();
		});

		it("sets and gets active project ID", async () => {
			storage.set("projects", []);
			await setActiveProjectId("abc-123");

			const id = await getActiveProjectId();
			expect(id).toBe("abc-123");
		});

		it("clears active project ID", async () => {
			storage.set("projects", []);
			storage.set("activeProjectId", "abc");
			await setActiveProjectId(null);

			const id = await getActiveProjectId();
			expect(id).toBeNull();
		});
	});
});
