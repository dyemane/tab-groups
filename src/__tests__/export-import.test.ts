import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	exportAllProjects,
	importProjects,
	parseExportData,
} from "../lib/export-import.js";
import type { Project } from "../lib/types.js";

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
		groups: [
			{
				title: "Docs",
				color: "blue",
				collapsed: false,
				tabs: [{ url: "https://example.com", title: "Example", pinned: false }],
			},
		],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	};
}

describe("export-import", () => {
	beforeEach(() => {
		storage.clear();
		vi.clearAllMocks();
	});

	describe("parseExportData", () => {
		it("parses valid export data", () => {
			const project = makeProject({ name: "Valid" });
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				projects: [project],
			});

			const result = parseExportData(json);
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Valid");
		});

		it("rejects invalid JSON", () => {
			expect(() => parseExportData("not json")).toThrow("Invalid JSON");
		});

		it("rejects wrong version", () => {
			const json = JSON.stringify({ version: 99, projects: [] });
			expect(() => parseExportData(json)).toThrow("Unsupported export version");
		});

		it("rejects missing projects array", () => {
			const json = JSON.stringify({ version: 1 });
			expect(() => parseExportData(json)).toThrow("missing projects array");
		});

		it("rejects project with missing id", () => {
			const json = JSON.stringify({
				version: 1,
				projects: [{ name: "No ID", groups: [], createdAt: 1, updatedAt: 1 }],
			});
			expect(() => parseExportData(json)).toThrow("missing id");
		});

		it("rejects project with invalid group color", () => {
			const json = JSON.stringify({
				version: 1,
				projects: [
					{
						id: "abc",
						name: "Bad Color",
						groups: [
							{
								title: "Test",
								color: "magenta",
								collapsed: false,
								tabs: [],
							},
						],
						createdAt: 1,
						updatedAt: 1,
					},
				],
			});
			expect(() => parseExportData(json)).toThrow("Invalid group color");
		});

		it("rejects tab with missing url", () => {
			const json = JSON.stringify({
				version: 1,
				projects: [
					{
						id: "abc",
						name: "Bad Tab",
						groups: [
							{
								title: "Test",
								color: "blue",
								collapsed: false,
								tabs: [{ title: "No URL", pinned: false }],
							},
						],
						createdAt: 1,
						updatedAt: 1,
					},
				],
			});
			expect(() => parseExportData(json)).toThrow("missing url");
		});
	});

	describe("exportAllProjects", () => {
		it("exports all stored projects as JSON", async () => {
			const p1 = makeProject({ name: "Alpha" });
			const p2 = makeProject({ name: "Beta" });
			storage.set("projects", [p1, p2]);

			const json = await exportAllProjects();
			const data = JSON.parse(json);

			expect(data.version).toBe(1);
			expect(data.exportedAt).toBeDefined();
			expect(data.projects).toHaveLength(2);
			expect(data.projects[0].name).toBe("Alpha");
			expect(data.projects[1].name).toBe("Beta");
		});

		it("exports empty array when no projects", async () => {
			const json = await exportAllProjects();
			const data = JSON.parse(json);
			expect(data.projects).toEqual([]);
		});
	});

	describe("importProjects", () => {
		it("imports projects in merge mode (default)", async () => {
			const existing = makeProject({ name: "Existing" });
			storage.set("projects", [existing]);
			storage.set("activeProjectId", null);

			const incoming = makeProject({ name: "New" });
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				projects: [incoming],
			});

			const result = await importProjects(json);
			expect(result.imported).toBe(1);
			expect(result.skipped).toBe(0);

			const projects = storage.get("projects") as Project[];
			expect(projects).toHaveLength(2);
		});

		it("skips duplicates by ID in merge mode", async () => {
			const project = makeProject({ name: "Same" });
			storage.set("projects", [project]);
			storage.set("activeProjectId", null);

			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				projects: [project],
			});

			const result = await importProjects(json, "merge");
			expect(result.imported).toBe(0);
			expect(result.skipped).toBe(1);

			const projects = storage.get("projects") as Project[];
			expect(projects).toHaveLength(1);
		});

		it("replaces all projects in replace mode", async () => {
			const existing = makeProject({ name: "Old" });
			storage.set("projects", [existing]);
			storage.set("activeProjectId", existing.id);

			const incoming = makeProject({ name: "Replacement" });
			const json = JSON.stringify({
				version: 1,
				exportedAt: new Date().toISOString(),
				projects: [incoming],
			});

			const result = await importProjects(json, "replace");
			expect(result.imported).toBe(1);
			expect(result.skipped).toBe(0);

			const projects = storage.get("projects") as Project[];
			expect(projects).toHaveLength(1);
			expect(projects[0].name).toBe("Replacement");
		});

		it("throws on invalid import data", async () => {
			await expect(importProjects("not json")).rejects.toThrow("Invalid JSON");
		});
	});
});
