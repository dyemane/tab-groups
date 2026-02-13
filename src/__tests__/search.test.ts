import { describe, expect, it } from "vitest";
import { countSearchMatches, searchProjects } from "../lib/search.js";
import type { Project } from "../lib/types.js";

function makeProject(
	name: string,
	groups: { title: string; tabs: { title: string; url: string }[] }[],
): Project {
	return {
		id: `id-${name}`,
		name,
		groups: groups.map((g) => ({
			title: g.title,
			color: "blue" as const,
			collapsed: false,
			tabs: g.tabs.map((t) => ({ ...t, pinned: false })),
		})),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
}

const projects: Project[] = [
	makeProject("my-app", [
		{
			title: "Docs",
			tabs: [
				{ title: "Drizzle ORM", url: "https://orm.drizzle.team" },
				{ title: "Hono Docs", url: "https://hono.dev/docs" },
			],
		},
		{
			title: "PRs",
			tabs: [
				{
					title: "Pull Requests - my-app",
					url: "https://github.com/acme/my-app/pulls",
				},
			],
		},
	]),
	makeProject("dashboard", [
		{
			title: "Code",
			tabs: [
				{ title: "acme/dashboard", url: "https://github.com/acme/dashboard" },
			],
		},
		{
			title: "Store",
			tabs: [
				{ title: "Chrome Web Store", url: "https://chromewebstore.google.com" },
			],
		},
	]),
	makeProject("empty-project", []),
];

describe("searchProjects", () => {
	it("returns empty for empty query", () => {
		expect(searchProjects(projects, "")).toEqual([]);
		expect(searchProjects(projects, "  ")).toEqual([]);
	});

	it("matches tab titles (case-insensitive)", () => {
		const results = searchProjects(projects, "drizzle");
		expect(results).toHaveLength(1);
		expect(results[0].project.name).toBe("my-app");
		expect(results[0].matchingGroups).toHaveLength(1);
		expect(results[0].matchingGroups[0].matchingTabs).toHaveLength(1);
		expect(results[0].matchingGroups[0].matchingTabs[0].title).toBe(
			"Drizzle ORM",
		);
	});

	it("matches tab URLs", () => {
		const results = searchProjects(projects, "github.com");
		expect(results).toHaveLength(2);
		expect(results[0].project.name).toBe("my-app");
		expect(results[1].project.name).toBe("dashboard");
	});

	it("matches project name even with no tab matches", () => {
		const results = searchProjects(projects, "empty-project");
		expect(results).toHaveLength(1);
		expect(results[0].project.name).toBe("empty-project");
		expect(results[0].matchingGroups).toHaveLength(0);
	});

	it("matches across multiple groups in same project", () => {
		const results = searchProjects(projects, "acme");
		expect(results).toHaveLength(2);
		// my-app has acme in PRs group URL
		const myApp = results.find((r) => r.project.name === "my-app");
		expect(myApp?.matchingGroups).toHaveLength(1);
		// dashboard has acme in Code group URL
		const dashboard = results.find((r) => r.project.name === "dashboard");
		expect(dashboard?.matchingGroups).toHaveLength(1);
	});

	it("returns no results for non-matching query", () => {
		const results = searchProjects(projects, "zzzznotfound");
		expect(results).toHaveLength(0);
	});
});

describe("countSearchMatches", () => {
	it("counts total matching tabs", () => {
		const results = searchProjects(projects, "github.com");
		const count = countSearchMatches(results);
		expect(count).toBe(2); // one in my-app PRs, one in dashboard Code
	});

	it("returns 0 for no matches", () => {
		const results = searchProjects(projects, "zzzznotfound");
		expect(countSearchMatches(results)).toBe(0);
	});

	it("returns 0 for project-name-only matches", () => {
		const results = searchProjects(projects, "empty-project");
		expect(countSearchMatches(results)).toBe(0);
	});
});
