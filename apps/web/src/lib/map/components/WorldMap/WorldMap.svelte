<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { IconButton } from '@study-atelier/ui';
	import { geoPath } from 'd3-geo';
	import { untrack } from 'svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import { MapPointer } from '#lib/map/map-pointer/map-pointer.ts';
	import { MapZoom, ZOOM_STEP } from '#lib/map/map-zoom/map-zoom.svelte.ts';
	import { mapProjection } from '#lib/map/projection/projection.ts';
	import type { Geography } from '#lib/map/types/geography.ts';
	import type { MapCity } from '#lib/map/types/map-city.ts';
	import type { PlacePoint } from '#lib/map/types/place-point.ts';

	type Props = {
		geography: Geography;
		fit: PlacePoint[];
		cities?: MapCity[];
		selected?: string;
		marker?: PlacePoint | null;
		small?: boolean;
		onselect?: (city: MapCity) => void;
		onpick?: (point: PlacePoint) => void;
	};

	let {
		geography,
		fit,
		cities = [],
		selected,
		marker = null,
		small = false,
		onselect,
		onpick
	}: Props = $props();

	const PHONE_WIDTH = 520;
	const KEEP_IN_VIEW = 64;

	let width = $state(0);
	let height = $state(0);
	let narrow = $derived(width > 0 && width < PHONE_WIDTH);
	let fitKey = $derived(fit.map((point) => `${point.latitude},${point.longitude}`).join(';'));
	let frame = $state<{ key: string; width: number; height: number }>();
	let projection = $derived.by(() => {
		const size = frame ?? { width: 1, height: 1 };
		return mapProjection(
			untrack(() => fit),
			size.width,
			size.height
		);
	});
	let path = $derived(geoPath(projection));
	let land = $derived(width > 0 && height > 0 ? (path(geography.land) ?? '') : '');
	let borders = $derived(width > 0 && height > 0 ? (path(geography.borders) ?? '') : '');

	const zoom = new MapZoom();
	const pointer = new MapPointer(zoom, pick);

	$effect(() => {
		if (width === 0 || height === 0 || frame?.key === fitKey) return;
		frame = { key: fitKey, width, height };
	});

	$effect(() => {
		void projection;
		zoom.reset();
	});

	$effect(() => {
		const size: [number, number] = [width, height];
		untrack(() => keepSelectedInView(...size));
	});

	function shift(at: number, size: number, margin: number): number {
		if (at < margin) return margin - at;
		if (at > size - margin) return size - margin - at;
		return 0;
	}

	function keepSelectedInView(viewWidth: number, viewHeight: number): void {
		const city = cities.find((candidate) => candidate.key === selected);
		const spot = city && viewWidth > 0 && viewHeight > 0 ? place(city.point) : null;
		if (!spot) return;
		const margin = Math.min(KEEP_IN_VIEW, viewWidth / 4, viewHeight / 4);
		zoom.panBy(shift(spot[0], viewWidth, margin), shift(spot[1], viewHeight, margin));
	}

	function place(point: PlacePoint): [number, number] | null {
		const projected = projection([point.longitude, point.latitude]);
		return projected ? zoom.toScreen(projected[0], projected[1]) : null;
	}

	function radius(count: number): number {
		return narrow ? 8 + Math.sqrt(count) * 3.5 : 11 + Math.sqrt(count) * 5;
	}

	function pick(x: number, y: number): void {
		if (!onpick) return;
		const [mapX, mapY] = zoom.toMap(x, y);
		const inverted = projection.invert?.([mapX, mapY]);
		if (!inverted) return;
		const round = (value: number): number => Math.round(value * 100000) / 100000;
		onpick({ latitude: round(inverted[1]), longitude: round(inverted[0]) });
	}

	function wheel(element: SVGSVGElement): () => void {
		const listener = (event: WheelEvent): void => pointer.wheel(event);
		element.addEventListener('wheel', listener, { passive: false });
		return () => element.removeEventListener('wheel', listener);
	}

	function zoomBy(factor: number): void {
		zoom.zoomAt(width / 2, height / 2, factor);
	}
</script>

<div
	class="map"
	class:picking={onpick}
	class:small
	bind:clientHeight={height}
	bind:clientWidth={width}
>
	<svg
		{@attach wheel}
		aria-hidden="true"
		onpointercancel={(event) => pointer.cancel(event)}
		onpointerdown={(event) => pointer.down(event)}
		onpointermove={(event) => pointer.move(event)}
		onpointerup={(event) => pointer.up(event)}
		viewBox="0 0 {Math.max(width, 1)} {Math.max(height, 1)}"
	>
		<g transform="translate({zoom.x} {zoom.y}) scale({zoom.scale})">
			<path class="land" d={land} />
			<path class="borders" d={borders} />
		</g>
	</svg>
	{#each cities as city (city.key)}
		{@const spot = place(city.point)}
		{#if spot}
			<button
				style:left="{spot[0]}px"
				style:top="{spot[1]}px"
				style:--city-size="{radius(city.count) * 2}px"
				class="city"
				class:narrow
				class:seen={city.seen > 0}
				class:selected={city.key === selected}
				aria-label="{city.name}, {m.map.city.artworks(city.count)}"
				aria-pressed={city.key === selected}
				onclick={() => onselect?.(city)}
				type="button"
			>
				<span class="disc">
					<svg aria-hidden="true" viewBox="0 0 2 2"><circle cx="1" cy="1" r="0.94" /></svg>
					<span class="count">{city.count}</span>
				</span>
				<span class="name">{city.name}</span>
			</button>
		{/if}
	{/each}
	{#if marker}
		{@const spot = place(marker)}
		{#if spot}
			<svg
				style:left="{spot[0]}px"
				style:top="{spot[1]}px"
				class="marker"
				aria-hidden="true"
				viewBox="0 0 2 2"
			>
				<circle cx="1" cy="1" r="0.8" />
			</svg>
		{/if}
	{/if}
	<div class="zoom">
		<IconButton icon={Plus} label={m.map.zoomIn} onclick={() => zoomBy(ZOOM_STEP)} />
		<IconButton icon={Minus} label={m.map.zoomOut} onclick={() => zoomBy(1 / ZOOM_STEP)} />
	</div>
</div>

<style>
	.map {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		background: var(--color-bg);
		border: var(--border-width-hairline) solid var(--color-line);
		user-select: none;
	}

	.small {
		flex: none;
		max-height: 280px;
		aspect-ratio: 10 / 9;
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
		cursor: grab;
		touch-action: none;
	}

	.picking svg {
		cursor: crosshair;
	}

	.land {
		fill: var(--color-tag);
	}

	.borders {
		fill: none;
		stroke: var(--color-fg-muted);
		stroke-width: var(--border-width-hairline);
		vector-effect: non-scaling-stroke;
	}

	.city {
		position: absolute;
		display: grid;
		justify-items: center;
		gap: var(--spacing-1);
		padding: 0;
		border: none;
		background: none;
		color: var(--color-fg);
		font: inherit;
		cursor: pointer;
		transform: translate(-50%, calc(var(--city-size) / -2));
	}

	.disc {
		display: grid;
		width: var(--city-size);
		height: var(--city-size);
	}

	.disc > * {
		grid-area: 1 / 1;
	}

	.disc svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.disc circle {
		fill: var(--color-bg);
		stroke: var(--color-fg);
		stroke-width: 0.12;
	}

	.count {
		place-self: center;
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		font-weight: var(--font-weight-medium);
		line-height: 1;
	}

	.seen circle {
		fill: var(--color-highlight);
		stroke: var(--color-highlight);
	}

	.seen .count {
		color: var(--color-on-fg);
	}

	.selected circle {
		fill: var(--color-highlight);
		stroke: var(--color-fg);
	}

	.selected .count {
		color: var(--color-on-fg);
	}

	.city:focus-visible .disc {
		outline: var(--border-width-base) solid var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.city:focus-visible {
		outline: none;
	}

	.name {
		padding: 0 var(--spacing-1);
		background: color-mix(in srgb, var(--color-tag) 80%, transparent);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-md);
		font-style: italic;
		line-height: var(--line-height-xs);
		white-space: nowrap;
	}

	.narrow .name {
		font-size: var(--font-size-sm);
	}

	.marker {
		position: absolute;
		width: var(--spacing-6);
		height: var(--spacing-6);
		pointer-events: none;
		transform: translate(-50%, -50%);
	}

	.marker circle {
		fill: var(--color-fg);
		stroke: var(--color-bg);
		stroke-width: 0.3;
	}

	.zoom {
		position: absolute;
		right: var(--spacing-3);
		bottom: var(--spacing-3);
		display: grid;
		gap: var(--spacing-1);
	}
</style>
