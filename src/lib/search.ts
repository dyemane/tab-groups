import type { Project, SavedGroup, SavedTab } from "./types.js";

export interface SearchResult {
	project: Project;
	/** Groups that have at least one matching tab */
	matchingGroups: GroupMatch[];
}

export interface GroupMatch {
	group: SavedGroup;
	/** Tabs that match the query */
	matchingTabs: SavedTab[];
}

/** Search across all projects for tabs matching a query (case-insensitive) */
export function searchProjects(
	projects: Project[],
	query: string,
): SearchResult[] {
	const q = query.toLowerCase().trim();
	if (!q) return [];

	const results: SearchResult[] = [];

	for (const project of projects) {
		const matchingGroups: GroupMatch[] = [];

		for (const group of project.groups) {
			const matchingTabs = group.tabs.filter(
				(tab) =>
					tab.title.toLowerCase().includes(q) ||
					tab.url.toLowerCase().includes(q),
			);

			if (matchingTabs.length > 0) {
				matchingGroups.push({ group, matchingTabs });
			}
		}

		// Also match project name
		if (matchingGroups.length > 0 || project.name.toLowerCase().includes(q)) {
			results.push({ project, matchingGroups });
		}
	}

	return results;
}

/** Count total matching tabs across all results */
export function countSearchMatches(results: SearchResult[]): number {
	return results.reduce(
		(sum, r) =>
			sum + r.matchingGroups.reduce((gs, g) => gs + g.matchingTabs.length, 0),
		0,
	);
}
