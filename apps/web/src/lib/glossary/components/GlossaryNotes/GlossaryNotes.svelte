<script lang="ts">
	import { Notes, type NoteLinks } from '@study-atelier/ui';
	import { noteTermsOf } from '#lib/glossary/note-terms/note-terms.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard/GlossaryTermCard.svelte';

	type Props = {
		value: string;
		links?: NoteLinks;
		entries?: GlossaryEntry[];
		linked?: boolean;
		plain?: boolean;
	};

	let { value, links, entries = [], linked = true, plain = false }: Props = $props();

	const terms = $derived(noteTermsOf(entries));
</script>

<Notes interactive={linked} {links} {plain} {terms} {value}>
	{#snippet termCard(id)}
		{@const entry = entries.find((candidate) => candidate.id === id)}
		{#if entry}
			<GlossaryTermCard {entry} {linked} />
		{/if}
	{/snippet}
</Notes>
