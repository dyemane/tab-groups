import { describe, expect, it } from "vitest";
import { countTabs, diffProjects } from "../lib/tab-groups.js";
import type { Project, SavedGroup } from "../lib/types.js";

function makeGroup(overrides: Partial<SavedGroup> = {}): SavedGroup {
	return {
		title: "Test",
		color: "blue",
		collapsed: false,
		tabs: [],
		...overrides,
	};
}

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		id: "test-id",
		name: "Test",
		groups: [],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		...overrides,
	};
}

describe("tab-groups", () => {
	describe("countTabs", () => {
		it("returns 0 for project with no groups", () => {
			const project = makeProject();
			expect(countTabs(project)).toBe(0);
		});

		it("counts tabs across all groups", () => {
			const project = makeProject({
				groups: [
					makeGroup({
						title: "Docs",
						tabs: [
							{ url: "https://a.com", title: "A", pinned: false },
							{ url: "https://b.com", title: "B", pinned: false },
						],
					}),
					makeGroup({
						title: "Code",
						tabs: [{ url: "https://c.com", title: "C", pinned: false }],
					}),
				],
			});
			expect(countTabs(project)).toBe(3);
		});
	});

	describe("diffProjects", () => {
		it("detects added groups", () => {
			const a = makeProject({ groups: [makeGroup({ title: "Docs" })] });
			const b = makeProject({
				groups: [makeGroup({ title: "Docs" }), makeGroup({ title: "Code" })],
			});

			const diff = diffProjects(a, b);
			expect(diff.added).toEqual(["Code"]);
			expect(diff.removed).toEqual([]);
			expect(diff.modified).toEqual([]);
		});

		it("detects removed groups", () => {
			const a = makeProject({
				groups: [makeGroup({ title: "Docs" }), makeGroup({ title: "Code" })],
			});
			const b = makeProject({ groups: [makeGroup({ title: "Docs" })] });

			const diff = diffProjects(a, b);
			expect(diff.added).toEqual([]);
			expect(diff.removed).toEqual(["Code"]);
		});

		it("detects modified groups (color change)", () => {
			const a = makeProject({
				groups: [makeGroup({ title: "Docs", color: "blue" })],
			});
			const b = makeProject({
				groups: [makeGroup({ title: "Docs", color: "red" })],
			});

			const diff = diffProjects(a, b);
			expect(diff.modified).toEqual(["Docs"]);
		});

		it("detects modified groups (tab change)", () => {
			const a = makeProject({
				groups: [
					makeGroup({
						title: "Docs",
						tabs: [{ url: "https://a.com", title: "A", pinned: false }],
					}),
				],
			});
			const b = makeProject({
				groups: [
					makeGroup({
						title: "Docs",
						tabs: [{ url: "https://b.com", title: "B", pinned: false }],
					}),
				],
			});

			const diff = diffProjects(a, b);
			expect(diff.modified).toEqual(["Docs"]);
		});

		it("reports no changes for identical projects", () => {
			const group = makeGroup({
				title: "Docs",
				color: "green",
				tabs: [{ url: "https://a.com", title: "A", pinned: false }],
			});
			const a = makeProject({ groups: [group] });
			const b = makeProject({ groups: [{ ...group }] });

			const diff = diffProjects(a, b);
			expect(diff.added).toEqual([]);
			expect(diff.removed).toEqual([]);
			expect(diff.modified).toEqual([]);
		});

		it("handles empty projects", () => {
			const a = makeProject();
			const b = makeProject();

			const diff = diffProjects(a, b);
			expect(diff.added).toEqual([]);
			expect(diff.removed).toEqual([]);
			expect(diff.modified).toEqual([]);
		});
	});
});
