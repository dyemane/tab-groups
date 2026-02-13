import { useCallback, useEffect, useState } from "preact/hooks";
import {
	getLiveGroups,
	getTabsInGroup,
	snapshotGroup,
} from "../../lib/tabs.js";
import type { SavedGroup } from "../../lib/types.js";

export function useTabGroups() {
	const [liveGroups, setLiveGroups] = useState<SavedGroup[]>([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		try {
			const groups = await getLiveGroups();
			const snapshots: SavedGroup[] = [];

			for (const group of groups) {
				const tabs = await getTabsInGroup(group.id);
				snapshots.push(snapshotGroup(group, tabs));
			}

			setLiveGroups(snapshots);
		} catch {
			setLiveGroups([]);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { liveGroups, loading, refresh };
}
