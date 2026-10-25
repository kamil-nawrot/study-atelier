<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { ArtworkTile } from '@study-atelier/ui';
	import { resolveImages } from '#lib/wall/wall-data/wall-data.ts';
	import { eraIcon, eraName } from '#lib/catalogue/eras/eras.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { ArtworkLane } from '#lib/timeline/types/artwork-lane.ts';
	import { cutLabel } from '#lib/timeline/labels/labels.ts';
	import { DOT_SIZE, marksIn, spread } from '#lib/timeline/placement/placement.ts';
	import type { Mark } from '#lib/timeline/types/mark.ts';
	import { boxStyle } from '#lib/timeline/stage/stage.ts';
	import type { StageGeometry } from '#lib/timeline/types/stage-geometry.ts';
	import type { Era } from '#lib/timeline/types/era.ts';

	type Props = {
		artworks: readonly WallArtwork[];
		era: Era;
		geometry: StageGeometry;
		selected: string | null;
		onselect: (artwork: WallArtwork) => void;
		lanes?: readonly ArtworkLane[];
		colourOf?: (artwork: WallArtwork) => string | undefined;
		empty?: string;
		layoutSpan?: number;
	};

	type Group = {
		key: string;
		lane?: ArtworkLane;
		count: number;
		from: number;
		marks: Mark<WallArtwork>[];
		across: number[];
	};

	let {
		artworks,
		era,
		geometry,
		selected,
		onselect,
		lanes = [],
		colourOf,
		empty,
		layoutSpan
	}: Props = $props();

	const EDGE = 10;
	const PREVIEW_WIDTH = 176;
	const VISIBLE_MARGIN = 40;
	const PREVIEW_GAP = 8;
	const LANE_LABEL = 22;

	let hovered = $state<string | null>(null);
	let pinnedKey = $state<string | null>(null);
	let previewHeight = $state(0);
	const resolved = new SvelteMap<string, WallArtwork>();
	const loading = new SvelteSet<string>();

	let vertical = $derived(geometry.orientation === 'vertical');
	let perYear = $derived(geometry.length / (layoutSpan ?? geometry.view.span));
	let laneSize = $derived(geometry.artworkLane);
	let zoneSize = $derived(geometry.artworksSize);
	let zoneFrom = $derived(geometry.artworksFrom);
	let laned = $derived(lanes.length > 0 && !vertical);
	let before = $derived(Math.max(0, geometry.position(era.start)));
	let laneMarks = $derived(
		(laned ? lanes : [undefined]).map((lane) => ({
			lane,
			marks: marksIn(lane ? lane.artworks : artworks, era)
		}))
	);
	let groups = $derived<Group[]>(
		laneMarks.map(({ lane, marks }, index) => {
			const top = laned ? LANE_LABEL : 0;
			const room = (laned ? laneSize : zoneSize) - top - 2 * EDGE;
			return {
				key: lane ? lane.key : 'all',
				lane,
				count: marks.length,
				from: zoneFrom + index * laneSize + top + EDGE,
				marks,
				across: spread(
					marks.map((mark) => mark.item.id),
					marks.map((mark) => mark.at * perYear),
					Math.max(room, 1)
				)
			};
		})
	);
	let placed = $derived(
		groups.flatMap((group) =>
			group.marks
				.map((mark, index) => ({
					key: `${group.key}:${mark.item.id}`,
					mark,
					at: geometry.position(mark.at),
					from: geometry.position(mark.start),
					cross: group.from + group.across[index],
					colour: group.lane ? group.lane.colour : colourOf?.(mark.item)
				}))
				.filter((dot) => dot.at > -VISIBLE_MARGIN && dot.from < geometry.length + VISIBLE_MARGIN)
		)
	);
	let nothing = $derived(groups.every((group) => group.count === 0));
	let shown = $derived(
		placed.find((dot) => dot.key === pinnedKey && dot.mark.item.id === selected) ??
			placed.find((dot) => dot.mark.item.id === selected) ??
			placed.find((dot) => dot.key === hovered)
	);

	function artworkOf(mark: Mark<WallArtwork>): WallArtwork {
		return resolved.get(mark.item.id) ?? mark.item;
	}

	async function loadImage(artwork: WallArtwork): Promise<void> {
		if (!artwork.pendingImage || resolved.has(artwork.id) || loading.has(artwork.id)) return;
		loading.add(artwork.id);
		try {
			const [result] = await resolveImages([artwork]);
			if (result) resolved.set(artwork.id, result);
		} finally {
			loading.delete(artwork.id);
		}
	}

	function show(key: string, artwork: WallArtwork): void {
		hovered = key;
		void loadImage(artwork);
	}

	function hide(key: string): void {
		if (hovered === key) hovered = null;
	}

	function choose(key: string, artwork: WallArtwork, event: MouseEvent): void {
		if (event instanceof PointerEvent && event.pointerType === 'mouse') return;
		pinnedKey = key;
		void loadImage(artwork);
		onselect(artwork);
	}

	function dateOf(mark: Mark<WallArtwork>): string | undefined {
		if (!mark.item.date) return undefined;
		return cutLabel(mark.item.date, mark.cutBefore, mark.cutAfter);
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

{#if laned}
	{#each groups as group, index (group.key)}
		{#if group.lane}
			<div
				style={boxStyle(geometry, {
					along: 0,
					across: geometry.artworksFrom + index * geometry.artworkLane,
					alongSize: geometry.length,
					acrossSize: geometry.artworkLane
				})}
				class="lane"
				class:first={index === 0}
				aria-hidden="true"
			>
				<span style:left={`${before}px`} class="lane-label">
					<svg style:fill={group.lane.colour} height="8" viewBox="0 0 8 8" width="8">
						<circle cx="4" cy="4" r="4" />
					</svg>
					{m.timeline.lane(group.lane.name, group.count)}
				</span>
			</div>
		{/if}
	{/each}
{/if}

{#if empty && nothing}
	<p
		style={boxStyle(
			geometry,
			vertical
				? {
						along: geometry.length / 2,
						across: geometry.artworksFrom,
						acrossSize: geometry.artworksSize
					}
				: { along: geometry.length / 2, across: geometry.artworksFrom + geometry.artworksSize / 2 }
		)}
		class="empty caption"
		class:vertical
	>
		{empty}
	</p>
{/if}

{#each placed as dot (dot.key)}
	<button
		style:--dot-colour={dot.colour}
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
		onblur={() => hide(dot.key)}
		onclick={(event) => choose(dot.key, dot.mark.item, event)}
		onfocus={(event) =>
			event.currentTarget.matches(':focus-visible') && show(dot.key, dot.mark.item)}
		onpointerenter={(event) => event.pointerType === 'mouse' && show(dot.key, dot.mark.item)}
		onpointerleave={(event) => event.pointerType === 'mouse' && hide(dot.key)}
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
		fill: var(--dot-colour, var(--color-fg));
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

	.lane {
		position: absolute;
		border-top: var(--border-width-hairline) solid var(--color-tag);
		pointer-events: none;
	}

	.lane.first {
		border-top: 0;
	}

	.lane-label {
		position: absolute;
		top: var(--spacing-1);
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		padding-left: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		white-space: nowrap;
	}

	.empty {
		position: absolute;
		z-index: 1;
		padding-inline: var(--spacing-2);
		transform: translate(-50%, -50%);
	}

	.empty.vertical {
		text-align: center;
		transform: translateY(-50%);
	}

	.preview {
		position: absolute;
		z-index: 5;
		display: grid;
		pointer-events: none;
	}
</style>
