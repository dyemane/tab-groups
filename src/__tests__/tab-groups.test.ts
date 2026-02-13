import { describe, expect, it } from "vitest";
import { countTabs, diffGroups } from "../lib/tab-groups.js";
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

	describe("diffGroups", () => {
		it("detects added groups", () => {
			const saved = [makeGroup({ title: "Docs" })];
			const live = [
				makeGroup({ title: "Docs" }),
				makeGroup({
					title: "Code",
					tabs: [{ url: "https://c.com", title: "C", pinned: false }],
				}),
			];

			const diff = diffGroups(saved, live);
			expect(diff.hasChanges).toBe(true);
			expect(diff.groups).toHaveLength(1);
			expect(diff.groups[0].title).toBe("Code");
			expect(diff.groups[0].status).toBe("added");
			expect(diff.totalAdded).toBe(1);
		});

		it("detects removed groups", () => {
			const saved = [
				makeGroup({ title: "Docs" }),
				makeGroup({
					title: "Code",
					tabs: [{ url: "https://c.com", title: "C", pinned: false }],
				}),
			];
			const live = [makeGroup({ title: "Docs" })];

			const diff = diffGroups(saved, live);
			expect(diff.hasChanges).toBe(true);
			expect(diff.groups[0].title).toBe("Code");
			expect(diff.groups[0].status).toBe("removed");
			expect(diff.totalRemoved).toBe(1);
		});

		it("detects added tabs within a group", () => {
			const saved = [
				makeGroup({
					title: "Docs",
					tabs: [{ url: "https://a.com", title: "A", pinned: false }],
				}),
			];
			const live = [
				makeGroup({
					title: "Docs",
					tabs: [
						{ url: "https://a.com", title: "A", pinned: false },
						{ url: "https://b.com", title: "B", pinned: false },
					],
				}),
			];

			const diff = diffGroups(saved, live);
			expect(diff.hasChanges).toBe(true);
			expect(diff.groups[0].status).toBe("modified");
			expect(diff.groups[0].addedTabs).toHaveLength(1);
			expect(diff.groups[0].addedTabs[0].url).toBe("https://b.com");
			expect(diff.groups[0].removedTabs).toHaveLength(0);
			expect(diff.totalAdded).toBe(1);
		});

		it("detects removed tabs within a group", () => {
			const saved = [
				makeGroup({
					title: "Docs",
					tabs: [
						{ url: "https://a.com", title: "A", pinned: false },
						{ url: "https://b.com", title: "B", pinned: false },
					],
				}),
			];
			const live = [
				makeGroup({
					title: "Docs",
					tabs: [{ url: "https://a.com", title: "A", pinned: false }],
				}),
			];

			const diff = diffGroups(saved, live);
			expect(diff.hasChanges).toBe(true);
			expect(diff.groups[0].status).toBe("modified");
			expect(diff.groups[0].addedTabs).toHaveLength(0);
			expect(diff.groups[0].removedTabs).toHaveLength(1);
			expect(diff.groups[0].removedTabs[0].url).toBe("https://b.com");
			expect(diff.totalRemoved).toBe(1);
		});

		it("reports no changes for identical groups", () => {
			const groups = [
				makeGroup({
					title: "Docs",
					tabs: [{ url: "https://a.com", title: "A", pinned: false }],
				}),
			];

			const diff = diffGroups(groups, groups);
			expect(diff.hasChanges).toBe(false);
			expect(diff.groups).toHaveLength(0);
			expect(diff.totalAdded).toBe(0);
			expect(diff.totalRemoved).toBe(0);
		});

		it("handles empty groups on both sides", () => {
			const diff = diffGroups([], []);
			expect(diff.hasChanges).toBe(false);
		});

		it("handles mixed adds and removes across groups", () => {
			const saved = [
				makeGroup({
					title: "Docs",
					tabs: [{ url: "https://a.com", title: "A", pinned: false }],
				}),
				makeGroup({
					title: "Old",
					tabs: [{ url: "https://old.com", title: "Old", pinned: false }],
				}),
			];
			const live = [
				makeGroup({
					title: "Docs",
					tabs: [
						{ url: "https://a.com", title: "A", pinned: false },
						{ url: "https://b.com", title: "B", pinned: false },
					],
				}),
				makeGroup({
					title: "New",
					tabs: [{ url: "https://new.com", title: "New", pinned: false }],
				}),
			];

			const diff = diffGroups(saved, live);
			expect(diff.hasChanges).toBe(true);
			expect(diff.totalAdded).toBe(2); // b.com in Docs + new.com in New
			expect(diff.totalRemoved).toBe(1); // old.com in Old
			expect(diff.groups).toHaveLength(3); // New (added), Old (removed), Docs (modified)
		});
	});
});
