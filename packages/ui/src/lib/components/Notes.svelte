<script lang="ts">
	import type { NoteLinks } from '../note-links';
	import { renderNotes } from '../notes-markdown';

	type Props = { value: string; links?: Pick<NoteLinks, 'resolve'> };

	let { value, links }: Props = $props();

	const html = $derived(renderNotes(value, links));
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

	.notes :global(a) {
		text-decoration-color: var(--color-fg-muted);
	}

	.notes :global(ul),
	.notes :global(ol) {
		display: grid;
		gap: var(--spacing-1);
		padding-left: var(--spacing-6);
	}
</style>
