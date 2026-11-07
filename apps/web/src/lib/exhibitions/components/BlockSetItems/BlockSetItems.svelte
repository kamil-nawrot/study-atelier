<script lang="ts">
	import CircleMinus from '@lucide/svelte/icons/circle-minus';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkFigure from '#lib/exhibitions/components/ArtworkFigure/ArtworkFigure.svelte';
	import CloseUpFigure from '#lib/exhibitions/components/CloseUpFigure/CloseUpFigure.svelte';
	import { itemsOf, withoutItem } from '#lib/exhibitions/editor/block-set/block-set.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

	type Props = {
		node: ExhibitionDocument;
		lookup: ArtworkLookup;
		onchange: (node: ExhibitionDocument) => void;
		ongrab: (event: PointerEvent) => void;
	};

	let { node, lookup, onchange, ongrab }: Props = $props();

	const items = $derived(itemsOf(node));
</script>

<div class="items">
	{#each items as item, index (index)}
		<div
			class="item grab"
			class:fit={item.type === 'closeUp'}
			onpointerdown={ongrab}
			role="presentation"
		>
			{#if item.type === 'closeUp'}
				<CloseUpFigure
					artworkId={String(item.attrs?.artworkId)}
					editable
					imageId={(item.attrs?.imageId as string | null | undefined) ?? null}
					{lookup}
					viewWidth={Number(item.attrs?.viewWidth)}
					x={Number(item.attrs?.x)}
					y={Number(item.attrs?.y)}
				/>
			{:else}
				<ArtworkFigure artworkId={String(item.attrs?.artworkId)} editable {lookup} paletteOnly />
			{/if}
			{#if items.length > 1}
				<button
					class="drop-item"
					aria-label={m.exhibitions.bar.removeItem(index + 1)}
					onclick={() => onchange(withoutItem(node, index))}
					title={m.exhibitions.bar.removeItem(index + 1)}
					type="button"
				>
					<CircleMinus aria-hidden="true" size={16} />
				</button>
			{/if}
		</div>
	{/each}
</div>

<style>
	.items {
		display: grid;
		gap: var(--spacing-6);
		justify-items: inherit;
		width: 100%;
	}

	.item {
		position: relative;
	}

	.item.fit {
		width: fit-content;
		max-width: 100%;
	}

	.drop-item {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		display: grid;
		place-items: center;
		min-width: var(--size-control);
		min-height: var(--size-control);
		padding: 0;
		border: var(--border-width-hairline) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
		color: var(--color-fg);
		cursor: pointer;
	}

	@media (hover: hover) {
		.item:not(:hover, :focus-within) > .drop-item {
			opacity: 0;
		}
	}

	:global(.rows.dragging) .drop-item {
		visibility: hidden;
	}

	.grab {
		display: grid;
		justify-items: inherit;
		width: 100%;
		cursor: grab;
		user-select: none;
	}
</style>
