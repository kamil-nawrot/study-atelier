<script lang="ts">
	import ArtworkFigure from '#lib/exhibitions/components/ArtworkFigure/ArtworkFigure.svelte';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import { isBlankText } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
	import {
		plainText,
		textBlockMarkdown
	} from '#lib/exhibitions/exhibition-markdown/exhibition-markdown.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

	type Props = {
		document: ExhibitionDocument;
		lookup: ArtworkLookup;
		entries?: readonly GlossaryTerm[];
	};

	let { document, lookup, entries }: Props = $props();

	let blocks = $derived(
		(document.content ?? []).filter((block, index, all) => {
			return !(index === all.length - 1 && isBlankText(block));
		})
	);
</script>

<div class="body">
	{#each blocks as block, index (index)}
		{#if block.type === 'textBlock'}
			{#if !isBlankText(block)}
				<div class="text">
					<GlossaryNotes {entries} value={textBlockMarkdown(block)} />
				</div>
			{/if}
		{:else if block.type === 'heading'}
			<h2 class="text">{plainText(block)}</h2>
		{:else if block.type === 'quote'}
			<blockquote class="text">
				<GlossaryNotes {entries} plain value={plainText(block)} />
			</blockquote>
		{:else if block.type === 'artwork'}
			<ArtworkFigure
				artworkId={String(block.attrs?.artworkId)}
				caption={plainText(block)}
				{entries}
				{lookup}
				showNote={Boolean(block.attrs?.note)}
			/>
		{/if}
	{/each}
</div>

<style>
	.body {
		display: grid;
		gap: var(--spacing-8);
		justify-items: start;
	}

	.text {
		max-width: var(--size-content-default);
		margin: 0;
	}

	h2 {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-lg);
	}

	blockquote {
		padding-left: var(--spacing-4);
		border-left: var(--border-width-base) solid var(--color-line);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		font-style: italic;
	}
</style>
