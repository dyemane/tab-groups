import { useCallback, useEffect, useState } from "preact/hooks";
import {
	getProjects,
	deleteProject as removeProject,
	saveProject,
} from "../../lib/storage.js";
import { captureProject } from "../../lib/tab-groups.js";
import type { Project } from "../../lib/types.js";

export function useProjects() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		const p = await getProjects();
		setProjects(p);
		setLoading(false);
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const saveCurrentAsProject = useCallback(
		async (name: string) => {
			const project = await captureProject(name);
			await refresh();
			return project;
		},
		[refresh],
	);

	const updateProject = useCallback(
		async (project: Project) => {
			await saveProject(project);
			await refresh();
		},
		[refresh],
	);

	const deleteProject = useCallback(
		async (id: string) => {
			await removeProject(id);
			await refresh();
		},
		[refresh],
	);

	return {
		projects,
		loading,
		refresh,
		saveCurrentAsProject,
		updateProject,
		deleteProject,
	};
}
