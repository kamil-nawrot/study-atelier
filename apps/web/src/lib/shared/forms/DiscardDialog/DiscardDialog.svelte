<script generics="T" lang="ts">
	import { Button, Dialog } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';

	type Props = {
		changes: UnsavedChanges<T>;
		description: string;
		keepLabel?: string;
	};

	let { changes, description, keepLabel = m.artworkForm.keepEditing }: Props = $props();
</script>

<Dialog
	{description}
	onclose={() => changes.answer(false)}
	size="small"
	title={m.artworkForm.discardTitle}
	bind:open={changes.open}
>
	{#snippet footer()}
		<Button onclick={() => changes.answer(false)}>
			{keepLabel}
		</Button>
		<Button onclick={() => changes.answer(true)} variant="primary">
			{m.artworkForm.discard}
		</Button>
	{/snippet}
</Dialog>
