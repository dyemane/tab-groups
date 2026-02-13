import type { Project } from "../../lib/types.js";
import { ProjectCard } from "./ProjectCard.js";

interface ProjectListProps {
	projects: Project[];
	activeProjectId: string | null;
	onDelete: (id: string) => Promise<void>;
	onSetActive: (id: string | null) => Promise<void>;
	onRefresh: () => Promise<void>;
}

export function ProjectList({
	projects,
	activeProjectId,
	onDelete,
	onSetActive,
	onRefresh,
}: ProjectListProps) {
	if (projects.length === 0) {
		return (
			<div class="empty-state">
				<p>No saved projects yet</p>
				<p>Create tab groups in Chrome, then save them as a project above.</p>
			</div>
		);
	}

	return (
		<div class="project-list">
			{projects.map((project) => (
				<ProjectCard
					key={project.id}
					project={project}
					isActive={project.id === activeProjectId}
					onDelete={onDelete}
					onSetActive={onSetActive}
					onRefresh={onRefresh}
				/>
			))}
		</div>
	);
}
