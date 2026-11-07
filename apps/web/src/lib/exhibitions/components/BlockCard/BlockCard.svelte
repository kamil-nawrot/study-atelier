<script lang="ts">
	import Bold from '@lucide/svelte/icons/bold';
	import CopyPlus from '@lucide/svelte/icons/copy-plus';
	import Italic from '@lucide/svelte/icons/italic';
	import List from '@lucide/svelte/icons/list';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import SeparatorHorizontal from '@lucide/svelte/icons/separator-horizontal';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import { untrack } from 'svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkFigure from '#lib/exhibitions/components/ArtworkFigure/ArtworkFigure.svelte';
	import ExhibitionDivider from '#lib/exhibitions/components/ExhibitionDivider/ExhibitionDivider.svelte';
	import BlockSetItems from '#lib/exhibitions/components/BlockSetItems/BlockSetItems.svelte';
	import BlockBar from '#lib/exhibitions/components/BlockBar/BlockBar.svelte';
	import { plainText } from '#lib/exhibitions/exhibition-markdown/exhibition-markdown.ts';
	import {
		headingNode,
		headingText,
		kindOf,
		quoteNode,
		quoteText
	} from '#lib/exhibitions/editor/new-block/new-block.ts';
	import { TextField } from '#lib/exhibitions/editor/text-field/text-field.svelte.ts';
	import { placed, positionOf } from '#lib/exhibitions/editor/block-position/block-position.ts';
	import { canGrow } from '#lib/exhibitions/editor/block-set/block-set.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { Block } from '#lib/exhibitions/editor/block-rows/block-rows.ts';
	import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

	type Props = {
		block: Block;
		lookup: ArtworkLookup;
		canUp: boolean;
		canDown: boolean;
		moving?: boolean;
		onmovestart: (event: PointerEvent) => void;
		onstep: (direction: -1 | 1) => void;
		onremove: () => void;
		onchange: (node: ExhibitionDocument) => void;
		onaddmore?: () => void;
	};

	let {
		block,
		lookup,
		canUp,
		canDown,
		moving = false,
		onmovestart,
		onstep,
		onremove,
		onchange,
		onaddmore
	}: Props = $props();

	let field = $state<TextField>();

	const kind = $derived(kindOf(block.node));
	const attrs = $derived(block.node.attrs ?? {});
	const label = $derived(m.exhibitions.blocks[kind]);
	const position = $derived(positionOf(block.node));
	const grows = $derived(kind === 'closeUp' || kind === 'palette');

	function keep(node: ExhibitionDocument): void {
		const attrs = { ...block.node.attrs, ...node.attrs };
		onchange(Object.keys(attrs).length > 0 ? { ...node, attrs } : node);
	}

	function text(element: HTMLElement): () => void {
		const created = untrack(
			() =>
				new TextField({
					element,
					node: block.node,
					label: m.exhibitions.blocks.textBlock,
					onchange: (node) => keep(node)
				})
		);
		field = created;
		return () => {
			created.destroy();
			field = undefined;
		};
	}

	function toggle(name: 'note' | 'line'): void {
		onchange({ ...block.node, attrs: { ...attrs, [name]: !attrs[name] } });
	}

	function grab(event: PointerEvent): void {
		if (event.target instanceof Element && event.target.closest('a, button')) return;
		onmovestart(event);
	}
</script>

<div
	class="card"
	class:moving
	data-align={position.align}
	data-block-id={block.id}
	data-kind={kind}
	data-valign={position.valign}
>
	<BlockBar
		{canDown}
		{canUp}
		{label}
		{onmovestart}
		onposition={kind === 'divider' ? undefined : (next) => onchange(placed(block.node, next))}
		{onremove}
		{onstep}
		{position}
	>
		{#snippet tools()}
			{#if kind === 'textBlock' && field}
				<button
					aria-label={m.exhibitions.bar.bold}
					aria-pressed={field.bold}
					onclick={() => field?.toggle('bold')}
					title={m.exhibitions.bar.bold}
					type="button"
				>
					<Bold aria-hidden="true" size={16} />
				</button>
				<button
					aria-label={m.exhibitions.bar.italic}
					aria-pressed={field.italic}
					onclick={() => field?.toggle('italic')}
					title={m.exhibitions.bar.italic}
					type="button"
				>
					<Italic aria-hidden="true" size={16} />
				</button>
				<button
					aria-label={m.exhibitions.bar.bulletList}
					aria-pressed={field.bulletList}
					onclick={() => field?.list('bulletList')}
					title={m.exhibitions.bar.bulletList}
					type="button"
				>
					<List aria-hidden="true" size={16} />
				</button>
				<button
					aria-label={m.exhibitions.bar.orderedList}
					aria-pressed={field.orderedList}
					onclick={() => field?.list('orderedList')}
					title={m.exhibitions.bar.orderedList}
					type="button"
				>
					<ListOrdered aria-hidden="true" size={16} />
				</button>
			{:else if grows && onaddmore}
				<button
					aria-label={canGrow(block.node) ? m.exhibitions.bar.addMore : m.exhibitions.bar.full}
					disabled={!canGrow(block.node)}
					onclick={onaddmore}
					title={canGrow(block.node) ? m.exhibitions.bar.addMore : m.exhibitions.bar.full}
					type="button"
				>
					<CopyPlus aria-hidden="true" size={16} />
				</button>
			{:else if kind === 'artwork'}
				<button
					aria-label={m.exhibitions.bar.note}
					aria-pressed={Boolean(attrs.note)}
					onclick={() => toggle('note')}
					title={m.exhibitions.bar.note}
					type="button"
				>
					<StickyNote aria-hidden="true" size={16} />
				</button>
			{:else if kind === 'divider'}
				<button
					aria-label={m.exhibitions.bar.line}
					aria-pressed={Boolean(attrs.line)}
					onclick={() => toggle('line')}
					title={m.exhibitions.bar.line}
					type="button"
				>
					<SeparatorHorizontal aria-hidden="true" size={16} />
				</button>
			{/if}
		{/snippet}
	</BlockBar>
	<div class="content">
		{#if kind === 'textBlock'}
			<div
				class="text"
				class:empty={field?.empty}
				{@attach text}
				data-placeholder={m.exhibitions.blocks.textHint}
			></div>
		{:else if kind === 'heading'}
			<input
				class="heading"
				aria-label={m.exhibitions.blocks.heading}
				maxlength="200"
				oninput={(event) => keep(headingNode(event.currentTarget.value))}
				placeholder={m.exhibitions.blocks.headingHint}
				value={headingText(block.node)}
			/>
		{:else if kind === 'quote'}
			<textarea
				class="quote"
				aria-label={m.exhibitions.blocks.quote}
				oninput={(event) => keep(quoteNode(event.currentTarget.value))}
				placeholder={m.exhibitions.blocks.quoteHint}
				rows="1"
				value={quoteText(block.node)}></textarea>
		{:else if kind === 'divider'}
			<div class="grab" onpointerdown={grab} role="presentation">
				<ExhibitionDivider line={Boolean(attrs.line)} />
			</div>
		{:else if grows}
			<BlockSetItems {lookup} node={block.node} {onchange} ongrab={grab} />
		{:else}
			<div class="grab" onpointerdown={grab} role="presentation">
				<ArtworkFigure
					artworkId={String(attrs.artworkId)}
					caption={plainText(block.node)}
					editable
					{lookup}
					palette={Boolean(attrs.palette)}
					showNote={Boolean(attrs.note)}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.card {
		position: relative;
		display: grid;
		align-content: start;
		align-self: stretch;
		min-width: 0;
		padding: var(--spacing-6);
		container: block / inline-size;
		background: var(--color-surface);
		outline: var(--border-width-hairline) solid transparent;
	}

	:global(.rows:not(.dragging)) .card:hover,
	.card:focus-within {
		outline-color: var(--color-fg-muted);
	}

	.card:not(:hover, :focus-within) > :global(.bar) {
		opacity: 0;
	}

	.card:not(:hover, :focus-within) > :global(.bar > *) {
		pointer-events: none;
	}

	:global(.rows.dragging) .card > :global(.bar) {
		visibility: hidden;
	}

	@media (max-width: 767px) {
		.card {
			padding: var(--spacing-4);
		}
	}

	.card.moving {
		opacity: 0.4;
	}

	.content {
		display: grid;
		justify-items: start;
		min-width: 0;
	}

	.card[data-valign='middle'] {
		align-content: center;
	}

	.card[data-valign='bottom'] {
		align-content: end;
	}

	.card[data-align='center'] .content {
		--block-justify: center;

		justify-items: center;
		text-align: center;
	}

	.card[data-align='right'] .content {
		--block-justify: end;

		justify-items: end;
		text-align: right;
	}

	.grab {
		display: grid;
		justify-items: inherit;
		width: 100%;
		cursor: grab;
		user-select: none;
	}

	.text,
	.heading,
	.quote {
		box-sizing: border-box;
		width: 100%;
		max-width: var(--size-content-default);
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		line-height: var(--line-height-md);
		text-align: inherit;
	}

	.text :global(.tiptap) {
		min-height: calc(1em * var(--line-height-md));
		outline: none;
	}

	.text :global(p) {
		margin: 0;
	}

	.text :global(:is(ul, ol)) {
		display: grid;
		gap: var(--spacing-1);
		margin: 0;
		padding-left: var(--spacing-6);
	}

	.text.empty {
		position: relative;
	}

	.text.empty::before {
		content: attr(data-placeholder);
		position: absolute;
		color: var(--color-fg-muted);
		pointer-events: none;
	}

	.heading {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-xl);
	}

	.quote {
		field-sizing: content;
		min-height: calc(1em * var(--line-height-lg));
		padding-left: var(--spacing-4);
		border-left: var(--border-width-base) solid var(--color-line);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		font-style: italic;
		line-height: var(--line-height-lg);
		resize: none;
	}

	.heading:focus,
	.quote:focus {
		outline: none;
	}

	::placeholder {
		color: var(--color-fg-muted);
	}
</style>
