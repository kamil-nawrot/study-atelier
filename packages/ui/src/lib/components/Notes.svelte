<script lang="ts">
	import { renderNotes } from '../notes-markdown';

	type Props = { value: string };

	let { value }: Props = $props();

	const html = $derived(renderNotes(value));
</script>

<div
	class="notes"
	{@attach (node) => {
		node.innerHTML = html;
	}}
></div>

<style>
	.notes {
		display: grid;
		gap: var(--spacing-3);
		overflow-wrap: anywhere;
	}

	.notes :global(h3) {
		font-weight: var(--font-weight-medium);
	}

	.notes :global(ul),
	.notes :global(ol) {
		display: grid;
		gap: var(--spacing-1);
		padding-left: var(--spacing-6);
	}
</style>
