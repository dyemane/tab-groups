import { useCallback, useEffect, useState } from "preact/hooks";
import {
	getActiveProjectId,
	setActiveProjectId as storeActiveId,
} from "../../lib/storage.js";

export function useActiveProject() {
	const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		const id = await getActiveProjectId();
		setActiveProjectId(id);
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const setActive = useCallback(async (id: string | null) => {
		await storeActiveId(id);
		setActiveProjectId(id);
	}, []);

	return { activeProjectId, setActive, refresh };
}
