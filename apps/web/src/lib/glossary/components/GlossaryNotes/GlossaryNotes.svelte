<script lang="ts">
	import { Notes, type NoteLinks } from '@study-atelier/ui';
	import { noteTermsOf } from '#lib/glossary/note-terms/note-terms.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard/GlossaryTermCard.svelte';

	type Props = {
		value: string;
		links?: NoteLinks;
		entries?: readonly GlossaryTerm[];
		linked?: boolean;
		plain?: boolean;
	};

	let { value, links, entries = [], linked = true, plain = false }: Props = $props();

	const terms = $derived(noteTermsOf(entries));
</script>

<Notes interactive={linked} {links} {plain} {terms} {value}>
	{#snippet termCard(id)}
		{@const term = entries.find((candidate) => candidate.id === id)}
		{#if term}
			<GlossaryTermCard {linked} {term} />
		{/if}
	{/snippet}
</Notes>
