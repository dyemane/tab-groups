import { describe, expect, it, vi } from "vitest";
import { findMatchingGroup, snapshotGroup, snapshotTab } from "../lib/tabs.js";
import type { TabGroupColor } from "../lib/types.js";

describe("tabs", () => {
	describe("snapshotTab", () => {
		it("extracts url, title, pinned from Chrome tab", () => {
			const chromeTab = {
				url: "https://example.com",
				title: "Example",
				pinned: true,
			} as chrome.tabs.Tab;

			const saved = snapshotTab(chromeTab);
			expect(saved).toEqual({
				url: "https://example.com",
				title: "Example",
				pinned: true,
			});
		});

		it("falls back to pendingUrl when url is undefined", () => {
			const chromeTab = {
				url: undefined,
				pendingUrl: "https://loading.com",
				title: "Loading",
				pinned: false,
			} as chrome.tabs.Tab;

			const saved = snapshotTab(chromeTab);
			expect(saved.url).toBe("https://loading.com");
		});

		it("defaults to empty strings and false", () => {
			const chromeTab = {} as chrome.tabs.Tab;
			const saved = snapshotTab(chromeTab);

			expect(saved.url).toBe("");
			expect(saved.title).toBe("");
			expect(saved.pinned).toBe(false);
		});
	});

	describe("snapshotGroup", () => {
		it("converts Chrome group + tabs to SavedGroup", () => {
			const group = {
				title: "Docs",
				color: "blue" as TabGroupColor,
				collapsed: false,
				id: 1,
				windowId: 1,
			} as chrome.tabGroups.TabGroup;

			const tabs = [
				{ url: "https://docs.com", title: "Docs", pinned: false },
				{ url: "https://api.com", title: "API", pinned: true },
			] as chrome.tabs.Tab[];

			const saved = snapshotGroup(group, tabs);
			expect(saved.title).toBe("Docs");
			expect(saved.color).toBe("blue");
			expect(saved.collapsed).toBe(false);
			expect(saved.tabs).toHaveLength(2);
			expect(saved.tabs[0].url).toBe("https://docs.com");
			expect(saved.tabs[1].pinned).toBe(true);
		});

		it("defaults group title to empty string", () => {
			const group = {
				color: "red",
				collapsed: true,
			} as chrome.tabGroups.TabGroup;

			const saved = snapshotGroup(group, []);
			expect(saved.title).toBe("");
			expect(saved.collapsed).toBe(true);
		});
	});

	describe("findMatchingGroup", () => {
		const groups = [
			{ id: 1, title: "Docs", color: "blue", collapsed: false, windowId: 1 },
			{ id: 2, title: "Code", color: "green", collapsed: false, windowId: 1 },
			{ id: 3, title: "PRs", color: "purple", collapsed: true, windowId: 1 },
		] as chrome.tabGroups.TabGroup[];

		it("finds group by title and color", () => {
			const match = findMatchingGroup(groups, "Code", "green");
			expect(match).toBeDefined();
			expect(match?.id).toBe(2);
		});

		it("returns undefined when title matches but color differs", () => {
			const match = findMatchingGroup(groups, "Code", "red");
			expect(match).toBeUndefined();
		});

		it("returns undefined when no match", () => {
			const match = findMatchingGroup(groups, "Tests", "yellow");
			expect(match).toBeUndefined();
		});

		it("handles empty group list", () => {
			const match = findMatchingGroup([], "Docs", "blue");
			expect(match).toBeUndefined();
		});
	});
});
