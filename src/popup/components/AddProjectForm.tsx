import { useState } from "preact/hooks";

interface AddProjectFormProps {
	onSave: (name: string) => Promise<void>;
}

export function AddProjectForm({ onSave }: AddProjectFormProps) {
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed || saving) return;

		setSaving(true);
		try {
			await onSave(trimmed);
			setName("");
		} finally {
			setSaving(false);
		}
	};

	return (
		<form class="add-project-form" onSubmit={handleSubmit}>
			<input
				type="text"
				placeholder="Project name..."
				value={name}
				onInput={(e) => setName((e.target as HTMLInputElement).value)}
				disabled={saving}
			/>
			<button
				class="btn btn-primary btn-sm"
				type="submit"
				disabled={!name.trim() || saving}
			>
				{saving ? "..." : "Save"}
			</button>
		</form>
	);
}
