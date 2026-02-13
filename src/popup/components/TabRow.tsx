import type { SavedTab } from "../../lib/types.js";

interface TabRowProps {
	tab: SavedTab;
}

export function TabRow({ tab }: TabRowProps) {
	const faviconUrl = tab.url
		? `chrome-extension://invalid/favicon?pageUrl=${encodeURIComponent(tab.url)}`
		: "";

	return (
		<div class="tab-row">
			{faviconUrl ? (
				<img
					class="favicon"
					src={faviconUrl}
					alt=""
					onError={(e) => {
						(e.target as HTMLImageElement).style.display = "none";
					}}
				/>
			) : (
				<span class="favicon" />
			)}
			<span class="tab-title" title={tab.url}>
				{tab.title || tab.url}
			</span>
			{tab.pinned && <span title="Pinned">📌</span>}
		</div>
	);
}
