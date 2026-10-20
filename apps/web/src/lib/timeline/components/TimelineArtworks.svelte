<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { ArtworkTile } from '@study-atelier/ui';
	import { resolveImages } from '#lib/collection/artworks.ts';
	import { eraIcon, eraName } from '#lib/collection/eras.ts';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { DOT_SIZE, marksIn, spread, type Mark } from '../placement.ts';
	import type { StageGeometry } from '../stage.ts';
	import type { Era } from '../time.ts';

	type Props = {
		artworks: readonly WallArtwork[];
		era: Era;
		geometry: StageGeometry;
		selected: string | null;
		onselect: (artwork: WallArtwork) => void;
	};

	let { artworks, era, geometry, selected, onselect }: Props = $props();

	const EDGE = 10;
	const PREVIEW_WIDTH = 176;
	const VISIBLE_MARGIN = 40;
	const PREVIEW_GAP = 8;

	let hovered = $state<string | null>(null);
	let previewHeight = $state(0);
	const resolved = new SvelteMap<string, WallArtwork>();

	let marks = $derived(marksIn(artworks, era));
	let perYear = $derived(geometry.width / geometry.view.span);
	let across = $derived(
		spread(
			marks.map((mark) => mark.item.id),
			marks.map((mark) => mark.at * perYear),
			Math.max(geometry.artworksHeight - 2 * EDGE, 1)
		)
	);
	let placed = $derived(
		marks
			.map((mark, index) => ({
				mark,
				x: geometry.position(mark.at),
				from: geometry.position(mark.start),
				y: geometry.artworksTop + EDGE + across[index]
			}))
			.filter((dot) => dot.x > -VISIBLE_MARGIN && dot.from < geometry.width + VISIBLE_MARGIN)
	);
	let shown = $derived(
		placed.find((dot) => dot.mark.item.id === (hovered ?? selected)) ?? undefined
	);

	function artworkOf(mark: Mark<WallArtwork>): WallArtwork {
		return resolved.get(mark.item.id) ?? mark.item;
	}

	async function loadImage(artwork: WallArtwork): Promise<void> {
		if (!artwork.pendingImage || resolved.has(artwork.id)) return;
		const [result] = await resolveImages([artwork]);
		if (result) resolved.set(artwork.id, result);
	}

	function show(artwork: WallArtwork): void {
		hovered = artwork.id;
		void loadImage(artwork);
	}

	function hide(artwork: WallArtwork): void {
		if (hovered === artwork.id) hovered = null;
	}

	function choose(artwork: WallArtwork): void {
		void loadImage(artwork);
		onselect(artwork);
	}

	function dateOf(mark: Mark<WallArtwork>): string | undefined {
		if (!mark.item.date) return undefined;
		return `${mark.cutBefore ? '‹ ' : ''}${mark.item.date}${mark.cutAfter ? ' ›' : ''}`;
	}

	function previewLeft(x: number): number {
		const right = x + DOT_SIZE + PREVIEW_GAP;
		if (right + PREVIEW_WIDTH <= geometry.width) return right;
		return Math.max(x - DOT_SIZE - PREVIEW_GAP - PREVIEW_WIDTH, 0);
	}

	function previewTop(y: number): number {
		const bottom = geometry.artworksTop + geometry.artworksHeight;
		return Math.min(Math.max(y - previewHeight / 2, geometry.artworksTop), bottom - previewHeight);
	}
</script>

{#each placed as dot (dot.mark.item.id)}
	<button
		style:left={`${dot.from}px`}
		style:top={`${dot.y - DOT_SIZE / 2}px`}
		style:width={`${Math.max(dot.x - dot.from + DOT_SIZE / 2, DOT_SIZE)}px`}
		style:height={`${DOT_SIZE}px`}
		class="mark"
		class:selected={dot.mark.item.id === selected}
		class:spanned={dot.x - dot.from > DOT_SIZE}
		aria-label={[dot.mark.item.title, dateOf(dot.mark)].filter(Boolean).join(', ')}
		aria-pressed={dot.mark.item.id === selected}
		onblur={() => hide(dot.mark.item)}
		onclick={() => choose(dot.mark.item)}
		onfocus={() => show(dot.mark.item)}
		onpointerenter={(event) => event.pointerType === 'mouse' && show(dot.mark.item)}
		onpointerleave={(event) => event.pointerType === 'mouse' && hide(dot.mark.item)}
		type="button"
	>
		<span class="line"></span>
		<svg class="dot" aria-hidden="true" height={DOT_SIZE} viewBox="0 0 10 10" width={DOT_SIZE}>
			<circle cx="5" cy="5" r="5" />
		</svg>
	</button>
{/each}

{#if shown}
	{@const artwork = artworkOf(shown.mark)}
	<div
		style:left={`${previewLeft(shown.x)}px`}
		style:top={`${previewTop(shown.y)}px`}
		style:width={`${PREVIEW_WIDTH}px`}
		class="preview"
		aria-hidden="true"
		inert
		bind:clientHeight={previewHeight}
	>
		<ArtworkTile
			authors={artwork.authors}
			date={dateOf(shown.mark)}
			favourite={artwork.favourite}
			favouriteLabel={artwork.favourite ? m.favourite.remove : m.favourite.add}
			href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
			image={artwork.image}
			imageUnavailable={artwork.imageUnavailable}
			mark={artwork.eraCode ? eraIcon(artwork.eraCode) : undefined}
			markLabel={artwork.eraCode ? eraName(artwork.eraCode) : undefined}
			number={artwork.number}
			title={artwork.title}
		/>
	</div>
{/if}

<style>
	.mark {
		position: absolute;
		z-index: 1;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}

	.mark::after {
		position: absolute;
		inset: calc(-1 * var(--spacing-3));
		content: '';
	}

	.dot {
		position: absolute;
		top: 0;
		right: 0;
		fill: var(--color-fg);
	}

	.line {
		position: absolute;
		top: 50%;
		right: var(--spacing-1);
		left: 0;
		height: var(--border-width-base);
		background: var(--color-fg-muted);
		transform: translateY(-50%);
	}

	.mark:not(.spanned) .line {
		display: none;
	}

	.mark.selected .dot,
	.mark:focus-visible .dot {
		fill: var(--color-highlight);
	}

	.preview {
		position: absolute;
		z-index: 5;
		pointer-events: none;
	}
</style>
