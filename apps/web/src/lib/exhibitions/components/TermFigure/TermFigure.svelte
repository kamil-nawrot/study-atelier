<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import GlossaryTermCard from '#lib/glossary/components/GlossaryTermCard/GlossaryTermCard.svelte';
	import { termOf } from '#lib/exhibitions/editor/term-search/term-search.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

	type Props = {
		termId: string;
		terms?: readonly GlossaryTerm[];
		linked?: boolean;
	};

	let { termId, terms, linked = false }: Props = $props();

	const term = $derived(termOf(terms, termId));
</script>

<aside class="term" aria-label={term ? m.exhibitions.blocks.termOf(term.name) : undefined}>
	{#if term}
		<GlossaryTermCard {linked} {term} />
	{:else}
		<span class="gone">{m.glossary.card.deleted}</span>
	{/if}
</aside>

<style>
	.term {
		display: grid;
		gap: var(--spacing-2);
		justify-items: start;
		box-sizing: border-box;
		width: 100%;
		max-width: var(--size-content-default);
		padding: var(--spacing-6);
		border: var(--border-width-hairline) solid var(--color-line);
		text-align: start;
	}

	.gone {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
