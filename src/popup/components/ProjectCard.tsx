import { useState } from "preact/hooks";
import {
	captureProject,
	countTabs,
	switchToProject,
} from "../../lib/tab-groups.js";
import type { Project } from "../../lib/types.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { GroupRow } from "./GroupRow.js";

interface ProjectCardProps {
	project: Project;
	isActive: boolean;
	isDragging: boolean;
	isDropTarget: boolean;
	onDelete: (id: string) => Promise<void>;
	onSetActive: (id: string | null) => Promise<void>;
	onRefresh: () => Promise<void>;
	onDragStart: () => void;
	onDragOver: (e: DragEvent) => void;
	onDragLeave: () => void;
	onDrop: () => void;
	onDragEnd: () => void;
}

export function ProjectCard({
	project,
	isActive,
	isDragging,
	isDropTarget,
	onDelete,
	onSetActive,
	onRefresh,
	onDragStart,
	onDragOver,
	onDragLeave,
	onDrop,
	onDragEnd,
}: ProjectCardProps) {
	const [showConfirm, setShowConfirm] = useState(false);
	const [switching, setSwitching] = useState(false);

	const tabCount = countTabs(project);
	const timeAgo = formatTimeAgo(project.updatedAt);

	const handleSwitch = async () => {
		if (switching) return;
		setSwitching(true);
		try {
			await switchToProject(project.id);
			await onSetActive(project.id);
			await onRefresh();
		} finally {
			setSwitching(false);
		}
	};

	const handleUpdate = async () => {
		await captureProject(project.name, project.id);
		await onRefresh();
	};

	const handleDelete = async () => {
		setShowConfirm(false);
		await onDelete(project.id);
	};

	let className = "project-card";
	if (isActive) className += " active";
	if (isDragging) className += " dragging";
	if (isDropTarget) className += " drop-target";

	return (
		<div
			class={className}
			draggable
			onDragStart={(e) => {
				if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
				onDragStart();
			}}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={(e) => {
				e.preventDefault();
				onDrop();
			}}
			onDragEnd={onDragEnd}
		>
			<div class="project-card-header">
				<div class="project-card-name-row">
					<span class="drag-handle" title="Drag to reorder">
						⠿
					</span>
					<span class="project-card-name">{project.name}</span>
				</div>
				<div class="project-card-actions">
					{isActive ? (
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onClick={handleUpdate}
							title="Update with current tabs"
						>
							Update
						</button>
					) : (
						<button
							type="button"
							class="btn btn-primary btn-sm"
							onClick={handleSwitch}
							disabled={switching}
							title="Switch to this project"
						>
							{switching ? "..." : "Switch"}
						</button>
					)}
					<button
						type="button"
						class="btn btn-danger btn-sm"
						onClick={() => setShowConfirm(true)}
						title="Delete project"
					>
						✕
					</button>
				</div>
			</div>

			<div class="project-card-meta">
				{project.groups.length} group
				{project.groups.length !== 1 ? "s" : ""} · {tabCount} tab
				{tabCount !== 1 ? "s" : ""} · {timeAgo}
			</div>

			<div class="group-list">
				{project.groups.map((group) => (
					<GroupRow key={`${group.title}-${group.color}`} group={group} />
				))}
			</div>

			{showConfirm && (
				<ConfirmDialog
					title="Delete project?"
					message={`"${project.name}" and its saved groups will be permanently deleted.`}
					onConfirm={handleDelete}
					onCancel={() => setShowConfirm(false)}
				/>
			)}
		</div>
	);
}

function formatTimeAgo(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
