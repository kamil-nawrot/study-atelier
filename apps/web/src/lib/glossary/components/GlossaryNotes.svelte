<script lang="ts">
	import { Notes, type NoteLinks } from '@study-atelier/ui';
	import { noteTermsOf } from '../note-terms.ts';
	import type { GlossaryEntry } from '../types.ts';
	import GlossaryTermCard from './GlossaryTermCard.svelte';

	type Props = {
		value: string;
		links?: NoteLinks;
		entries?: GlossaryEntry[];
	};

	let { value, links, entries = [] }: Props = $props();

	const terms = $derived(noteTermsOf(entries));
</script>

<Notes {links} {terms} {value}>
	{#snippet termCard(id)}
		{@const entry = entries.find((candidate) => candidate.id === id)}
		{#if entry}
			<GlossaryTermCard {entry} />
		{/if}
	{/snippet}
</Notes>
