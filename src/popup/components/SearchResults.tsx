import type { SearchResult } from "../../lib/search.js";

interface SearchResultsProps {
	results: SearchResult[];
	query: string;
	onSwitchTo: (projectId: string, tabUrl?: string) => Promise<void>;
}

export function SearchResults({
	results,
	query,
	onSwitchTo,
}: SearchResultsProps) {
	if (results.length === 0) {
		return <div class="search-empty">No matches for &ldquo;{query}&rdquo;</div>;
	}

	return (
		<div class="search-results">
			{results.map((result) => (
				<div key={result.project.id} class="search-result-card">
					<div class="search-result-header">
						<span class="search-result-project">{result.project.name}</span>
						<button
							type="button"
							class="btn btn-primary btn-sm"
							onClick={() =>
								onSwitchTo(
									result.project.id,
									result.matchingGroups[0]?.matchingTabs[0]?.url,
								)
							}
						>
							Switch
						</button>
					</div>
					{result.matchingGroups.map((gm) => (
						<div
							key={`${gm.group.title}-${gm.group.color}`}
							class="search-result-group"
						>
							<span
								class="group-dot"
								style={{ backgroundColor: COLOR_MAP[gm.group.color] }}
							/>
							<span class="search-group-title">{gm.group.title}</span>
							<div class="search-matching-tabs">
								{gm.matchingTabs.map((tab) => (
									<button
										key={tab.url}
										type="button"
										class="search-tab"
										onClick={() => onSwitchTo(result.project.id, tab.url)}
										title={tab.url}
									>
										<HighlightedText text={tab.title} query={query} />
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			))}
		</div>
	);
}

function HighlightedText({ text, query }: { text: string; query: string }) {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const idx = lowerText.indexOf(lowerQuery);

	if (idx === -1) return <>{text}</>;

	return (
		<>
			{text.slice(0, idx)}
			<mark>{text.slice(idx, idx + query.length)}</mark>
			{text.slice(idx + query.length)}
		</>
	);
}

const COLOR_MAP: Record<string, string> = {
	grey: "#5f6368",
	blue: "#4A90D9",
	red: "#D93025",
	yellow: "#F9AB00",
	green: "#188038",
	pink: "#D01884",
	purple: "#9334E6",
	cyan: "#007B83",
};
