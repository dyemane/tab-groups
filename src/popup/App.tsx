import { AddProjectForm } from "./components/AddProjectForm.js";
import { ProjectList } from "./components/ProjectList.js";
import { useActiveProject } from "./hooks/useActiveProject.js";
import { useProjects } from "./hooks/useProjects.js";
import { useTabGroups } from "./hooks/useTabGroups.js";

export function App() {
	const { projects, loading, refresh, saveCurrentAsProject, deleteProject } =
		useProjects();
	const { liveGroups } = useTabGroups();
	const {
		activeProjectId,
		setActive,
		refresh: refreshActive,
	} = useActiveProject();

	const handleSave = async (name: string) => {
		await saveCurrentAsProject(name);
		await refreshActive();
	};

	const handleRefresh = async () => {
		await refresh();
		await refreshActive();
	};

	const liveTabCount = liveGroups.reduce((sum, g) => sum + g.tabs.length, 0);

	return (
		<div class="popup">
			<div class="popup-header">
				<h1>Tab Groups</h1>
				{liveGroups.length > 0 && (
					<span class="tab-count">
						{liveGroups.length} group{liveGroups.length !== 1 ? "s" : ""} ·{" "}
						{liveTabCount} tab{liveTabCount !== 1 ? "s" : ""}
					</span>
				)}
			</div>

			<AddProjectForm onSave={handleSave} disabled={liveGroups.length === 0} />

			{loading ? (
				<div class="empty-state">Loading...</div>
			) : (
				<ProjectList
					projects={projects}
					activeProjectId={activeProjectId}
					onDelete={deleteProject}
					onSetActive={setActive}
					onRefresh={handleRefresh}
				/>
			)}
		</div>
	);
}
