import { useState } from "preact/hooks";
import type { SavedGroup } from "../../lib/types.js";
import { TabRow } from "./TabRow.js";

interface GroupRowProps {
	group: SavedGroup;
}

const COLOR_MAP: Record<string, string> = {
	grey: "var(--group-grey)",
	blue: "var(--group-blue)",
	red: "var(--group-red)",
	yellow: "var(--group-yellow)",
	green: "var(--group-green)",
	pink: "var(--group-pink)",
	purple: "var(--group-purple)",
	cyan: "var(--group-cyan)",
};

export function GroupRow({ group }: GroupRowProps) {
	const [expanded, setExpanded] = useState(false);
	const color = COLOR_MAP[group.color] ?? COLOR_MAP.grey;

	return (
		<div>
			<button
				type="button"
				class="group-row"
				onClick={() => setExpanded(!expanded)}
			>
				<span class="group-dot" style={{ background: color }} />
				<span class="group-title">{group.title || "(untitled)"}</span>
				<span class="group-tab-count">
					{group.tabs.length} tab{group.tabs.length !== 1 ? "s" : ""}
				</span>
			</button>
			{expanded && (
				<div class="tab-list">
					{group.tabs.map((tab) => (
						<TabRow key={tab.url} tab={tab} />
					))}
				</div>
			)}
		</div>
	);
}
