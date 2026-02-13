/** Chrome's tab group color values */
export type TabGroupColor =
	| "grey"
	| "blue"
	| "red"
	| "yellow"
	| "green"
	| "pink"
	| "purple"
	| "cyan";

export interface SavedTab {
	url: string;
	title: string;
	pinned: boolean;
}

export interface SavedGroup {
	title: string;
	color: TabGroupColor;
	collapsed: boolean;
	tabs: SavedTab[];
}

export interface Project {
	id: string;
	name: string;
	groups: SavedGroup[];
	createdAt: number;
	updatedAt: number;
}

export interface ProjectStore {
	projects: Project[];
	activeProjectId: string | null;
}
