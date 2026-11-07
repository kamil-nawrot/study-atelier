<script lang="ts">
	import CloseUpFigure from '#lib/exhibitions/components/CloseUpFigure/CloseUpFigure.svelte';
	import ArtworkFigure from '#lib/exhibitions/components/ArtworkFigure/ArtworkFigure.svelte';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes/GlossaryNotes.svelte';
	import { isBlankText } from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
	import {
		plainText,
		textBlockMarkdown
	} from '#lib/exhibitions/exhibition-markdown/exhibition-markdown.ts';
	import type { JSONContent } from '@tiptap/core';
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

{#snippet blockOf(block: JSONContent)}
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
			palette={Boolean(block.attrs?.palette)}
			paletteOnly={Boolean(block.attrs?.paletteOnly)}
			showNote={Boolean(block.attrs?.note)}
		/>
	{:else if block.type === 'closeUp'}
		<CloseUpFigure
			artworkId={String(block.attrs?.artworkId)}
			imageId={(block.attrs?.imageId as string | null | undefined) ?? null}
			{lookup}
			viewWidth={Number(block.attrs?.viewWidth)}
			x={Number(block.attrs?.x)}
			y={Number(block.attrs?.y)}
		/>
	{:else if block.type === 'columns'}
		<div class="row" data-row="">
			{#each block.content ?? [] as column, index (index)}
				<div class="cell">
					{#each column.content ?? [] as inner, innerIndex (innerIndex)}
						{@render blockOf(inner)}
					{/each}
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

<div class="body">
	{#each blocks as block, index (index)}
		{@render blockOf(block)}
	{/each}
</div>

<style>
	.body {
		display: grid;
		gap: var(--spacing-8);
		justify-items: start;
	}

	.row {
		display: flex;
		gap: var(--spacing-8);
		align-items: flex-start;
		width: 100%;
	}

	.cell {
		display: grid;
		flex: 1 1 0;
		gap: var(--spacing-4);
		justify-items: start;
		min-width: 0;
	}

	@media (max-width: 767px) {
		.row {
			flex-direction: column;
			gap: var(--spacing-8);
		}
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
