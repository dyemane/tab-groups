import { useState } from "preact/hooks";
import type { Project } from "../../lib/types.js";
import { ProjectCard } from "./ProjectCard.js";

interface ProjectListProps {
	projects: Project[];
	activeProjectId: string | null;
	onDelete: (id: string) => Promise<void>;
	onSetActive: (id: string | null) => Promise<void>;
	onRefresh: () => Promise<void>;
	onReorder: (orderedIds: string[]) => Promise<void>;
}

export function ProjectList({
	projects,
	activeProjectId,
	onDelete,
	onSetActive,
	onRefresh,
	onReorder,
}: ProjectListProps) {
	const [dragId, setDragId] = useState<string | null>(null);
	const [dropTargetId, setDropTargetId] = useState<string | null>(null);

	if (projects.length === 0) {
		return (
			<div class="empty-state">
				<p>No saved projects yet</p>
				<p>Create tab groups in Chrome, then save them as a project above.</p>
			</div>
		);
	}

	const handleDragStart = (id: string) => {
		setDragId(id);
	};

	const handleDragOver = (e: DragEvent, id: string) => {
		e.preventDefault();
		if (id !== dragId) setDropTargetId(id);
	};

	const handleDragLeave = () => {
		setDropTargetId(null);
	};

	const handleDrop = async (targetId: string) => {
		setDropTargetId(null);
		if (!dragId || dragId === targetId) return;

		const ids = projects.map((p) => p.id);
		const fromIdx = ids.indexOf(dragId);
		const toIdx = ids.indexOf(targetId);
		if (fromIdx === -1 || toIdx === -1) return;

		ids.splice(fromIdx, 1);
		ids.splice(toIdx, 0, dragId);
		await onReorder(ids);
	};

	const handleDragEnd = () => {
		setDragId(null);
		setDropTargetId(null);
	};

	return (
		<div class="project-list">
			{projects.map((project) => (
				<ProjectCard
					key={project.id}
					project={project}
					isActive={project.id === activeProjectId}
					isDragging={project.id === dragId}
					isDropTarget={project.id === dropTargetId}
					onDelete={onDelete}
					onSetActive={onSetActive}
					onRefresh={onRefresh}
					onDragStart={() => handleDragStart(project.id)}
					onDragOver={(e: DragEvent) => handleDragOver(e, project.id)}
					onDragLeave={handleDragLeave}
					onDrop={() => handleDrop(project.id)}
					onDragEnd={handleDragEnd}
				/>
			))}
		</div>
	);
}
