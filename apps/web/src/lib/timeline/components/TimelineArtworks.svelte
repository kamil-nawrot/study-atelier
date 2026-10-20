<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { ArtworkTile, Icon } from '@study-atelier/ui';
	import { resolveImages } from '#lib/collection/artworks.ts';
	import { eraIcon, eraName } from '#lib/collection/eras.ts';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { DOT_SIZE, marksIn, spread, type Mark } from '../placement.ts';
	import { boxStyle, type StageGeometry } from '../stage.ts';
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
	let vertical = $derived(geometry.orientation === 'vertical');
	let perYear = $derived(geometry.length / geometry.view.span);
	let across = $derived(
		spread(
			marks.map((mark) => mark.item.id),
			marks.map((mark) => mark.at * perYear),
			Math.max(geometry.artworksSize - 2 * EDGE, 1)
		)
	);
	let placed = $derived(
		marks
			.map((mark, index) => ({
				mark,
				at: geometry.position(mark.at),
				from: geometry.position(mark.start),
				cross: geometry.artworksFrom + EDGE + across[index]
			}))
			.filter((dot) => dot.at > -VISIBLE_MARGIN && dot.from < geometry.length + VISIBLE_MARGIN)
	);
	let shown = $derived(
		placed.find((dot) => dot.mark.item.id === selected) ??
			placed.find((dot) => dot.mark.item.id === hovered)
	);
	let pinned = $derived(shown !== undefined && shown.mark.item.id === selected);

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

	function beside(at: number, room: number, size: number): number {
		const after = at + DOT_SIZE + PREVIEW_GAP;
		if (after + size <= room) return after;
		return Math.max(at - DOT_SIZE - PREVIEW_GAP - size, 0);
	}

	function centred(at: number, from: number, room: number, size: number): number {
		return Math.min(Math.max(at - size / 2, from), from + room - size);
	}

	function previewStyle(dot: { at: number; cross: number }): string {
		if (vertical) {
			const left = beside(dot.cross, geometry.breadth, PREVIEW_WIDTH);
			const top = centred(dot.at, 0, geometry.length, previewHeight);
			return `left: ${left}px; top: ${top}px; width: ${PREVIEW_WIDTH}px`;
		}
		const left = beside(dot.at, geometry.length, PREVIEW_WIDTH);
		const top = centred(dot.cross, geometry.artworksFrom, geometry.artworksSize, previewHeight);
		return `left: ${left}px; top: ${top}px; width: ${PREVIEW_WIDTH}px`;
	}
</script>

{#each placed as dot (dot.mark.item.id)}
	<button
		style={boxStyle(geometry, {
			along: Math.min(dot.from, dot.at - DOT_SIZE / 2),
			across: dot.cross - DOT_SIZE / 2,
			alongSize: Math.max(dot.at - dot.from + DOT_SIZE / 2, DOT_SIZE),
			acrossSize: DOT_SIZE
		})}
		class="mark"
		class:selected={dot.mark.item.id === selected}
		class:spanned={dot.at - dot.from > DOT_SIZE}
		class:vertical
		aria-label={[dot.mark.item.title, dateOf(dot.mark)].filter(Boolean).join(', ')}
		aria-pressed={dot.mark.item.id === selected}
		onblur={() => hide(dot.mark.item)}
		onclick={() => choose(dot.mark.item)}
		onfocus={(event) => event.currentTarget.matches(':focus-visible') && show(dot.mark.item)}
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
		style={previewStyle(shown)}
		class="preview"
		class:pinned
		aria-hidden={pinned ? undefined : 'true'}
		inert={!pinned}
		bind:clientHeight={previewHeight}
	>
		<div class="tile" inert>
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
		{#if pinned}
			<a
				class="details"
				href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
			>
				{m.timeline.showArtwork}
				<Icon icon={ArrowRight} size="sm" />
			</a>
		{/if}
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

	.vertical .line {
		top: 0;
		right: auto;
		bottom: var(--spacing-1);
		left: 50%;
		width: var(--border-width-base);
		height: auto;
		transform: translateX(-50%);
	}

	.vertical .dot {
		top: auto;
		bottom: 0;
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
		display: grid;
		pointer-events: none;
	}

	.preview.pinned {
		pointer-events: auto;
	}

	.details {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-3);
		background: var(--color-surface);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
	}
</style>
