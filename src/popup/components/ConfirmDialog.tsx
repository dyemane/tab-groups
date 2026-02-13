interface ConfirmDialogProps {
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	title,
	message,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<div
			class="confirm-overlay"
			role="presentation"
			onClick={onCancel}
			onKeyDown={(e) => {
				if (e.key === "Escape") onCancel();
			}}
		>
			<dialog
				class="confirm-dialog"
				open
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<h3>{title}</h3>
				<p>{message}</p>
				<div class="confirm-dialog-actions">
					<button type="button" class="btn btn-ghost btn-sm" onClick={onCancel}>
						Cancel
					</button>
					<button
						type="button"
						class="btn btn-danger btn-sm"
						onClick={onConfirm}
					>
						Delete
					</button>
				</div>
			</dialog>
		</div>
	);
}
