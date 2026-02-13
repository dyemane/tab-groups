import { useMemo, useRef, useState } from "preact/hooks";
import {
	downloadJson,
	exportAllProjects,
	importProjects,
} from "../lib/export-import.js";
import { countSearchMatches, searchProjects } from "../lib/search.js";
import { switchToProject } from "../lib/tab-groups.js";
import { activateTabByUrl } from "../lib/tabs.js";
import { AddProjectForm } from "./components/AddProjectForm.js";
import { ProjectList } from "./components/ProjectList.js";
import { SearchResults } from "./components/SearchResults.js";
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
	const [importStatus, setImportStatus] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const searchResults = useMemo(
		() => searchProjects(projects, searchQuery),
		[projects, searchQuery],
	);
	const matchCount = useMemo(
		() => countSearchMatches(searchResults),
		[searchResults],
	);
	const isSearching = searchQuery.trim().length > 0;

	const handleSave = async (name: string) => {
		await saveCurrentAsProject(name);
		await refreshActive();
	};

	const handleRefresh = async () => {
		await refresh();
		await refreshActive();
	};

	const handleExport = async () => {
		const json = await exportAllProjects();
		const date = new Date().toISOString().slice(0, 10);
		downloadJson(json, `tab-groups-${date}.json`);
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const json = await file.text();
			const result = await importProjects(json, "merge");
			setImportStatus(`Imported ${result.imported}, skipped ${result.skipped}`);
			await refresh();
			await refreshActive();
		} catch (err) {
			setImportStatus(
				`Error: ${err instanceof Error ? err.message : "Invalid file"}`,
			);
		}

		// Reset file input so same file can be re-imported
		input.value = "";

		// Clear status after 3 seconds
		setTimeout(() => setImportStatus(null), 3000);
	};

	const liveTabCount = liveGroups.reduce((sum, g) => sum + g.tabs.length, 0);

	return (
		<div class="popup">
			<div class="popup-header">
				<div class="popup-header-left">
					<h1>Tab Groups</h1>
					{liveGroups.length > 0 && (
						<span class="tab-count">
							{liveGroups.length} group{liveGroups.length !== 1 ? "s" : ""} ·{" "}
							{liveTabCount} tab{liveTabCount !== 1 ? "s" : ""}
						</span>
					)}
				</div>
				<div class="popup-header-actions">
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						onClick={handleImportClick}
						title="Import projects from JSON"
					>
						Import
					</button>
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						onClick={handleExport}
						disabled={projects.length === 0}
						title="Export all projects as JSON"
					>
						Export
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".json"
						class="hidden-file-input"
						onChange={handleFileChange}
					/>
				</div>
			</div>

			{importStatus && <div class="import-status">{importStatus}</div>}

			<AddProjectForm onSave={handleSave} />

			{projects.length > 0 && (
				<div class="search-bar">
					<input
						type="text"
						placeholder="Search tabs across projects..."
						value={searchQuery}
						onInput={(e) =>
							setSearchQuery((e.target as HTMLInputElement).value)
						}
					/>
					{isSearching && (
						<span class="search-count">
							{matchCount} tab{matchCount !== 1 ? "s" : ""} in{" "}
							{searchResults.length} project
							{searchResults.length !== 1 ? "s" : ""}
						</span>
					)}
				</div>
			)}

			{loading ? (
				<div class="empty-state">Loading...</div>
			) : isSearching ? (
				<SearchResults
					results={searchResults}
					query={searchQuery}
					onSwitchTo={async (id, tabUrl) => {
						await switchToProject(id);
						if (tabUrl) await activateTabByUrl(tabUrl);
						await setActive(id);
						await handleRefresh();
						setSearchQuery("");
					}}
				/>
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
