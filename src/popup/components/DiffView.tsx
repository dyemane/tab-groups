import { GROUP_COLORS } from "../../lib/colors.js";
import type { ProjectDiff } from "../../lib/tab-groups.js";

interface DiffViewProps {
	diff: ProjectDiff;
}

export function DiffView({ diff }: DiffViewProps) {
	if (!diff.hasChanges) return null;

	return (
		<div class="diff-view">
			<div class="diff-summary">
				{diff.totalAdded > 0 && (
					<span class="diff-added">
						+{diff.totalAdded} tab{diff.totalAdded !== 1 ? "s" : ""}
					</span>
				)}
				{diff.totalRemoved > 0 && (
					<span class="diff-removed">
						-{diff.totalRemoved} tab{diff.totalRemoved !== 1 ? "s" : ""}
					</span>
				)}
			</div>
			{diff.groups.map((g) => (
				<div key={g.title} class={`diff-group diff-group-${g.status}`}>
					<div class="diff-group-header">
						<span
							class="group-dot"
							style={{
								backgroundColor: GROUP_COLORS[g.color] ?? GROUP_COLORS.grey,
							}}
						/>
						<span class="diff-group-title">
							{g.status === "added" && "+ "}
							{g.status === "removed" && "- "}
							{g.title}
						</span>
					</div>
					{g.addedTabs.map((tab) => (
						<div key={tab.url} class="diff-tab diff-tab-added">
							+ {tab.title}
						</div>
					))}
					{g.removedTabs.map((tab) => (
						<div key={tab.url} class="diff-tab diff-tab-removed">
							- {tab.title}
						</div>
					))}
				</div>
			))}
		</div>
	);
}
