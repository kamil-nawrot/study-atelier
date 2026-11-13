<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { IconButton } from '@study-atelier/ui';
	import { geoPath } from 'd3-geo';
	import { untrack } from 'svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import CityFan from '#lib/map/components/CityFan/CityFan.svelte';
	import CityMarker from '#lib/map/components/CityMarker/CityMarker.svelte';
	import {
		type CityGroup,
		type CitySpot,
		fanOut,
		groupCities,
		labelledCities
	} from '#lib/map/map-groups/map-groups.ts';
	import { MapPointer } from '#lib/map/map-pointer/map-pointer.ts';
	import { MapZoom, ZOOM_STEP } from '#lib/map/map-zoom/map-zoom.svelte.ts';
	import { mapBounds, mapProjection } from '#lib/map/projection/projection.ts';
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
	const pointer = new MapPointer(zoom, tap, foldOnZoom);

	let fanned = $state<string>();

	let spots = $derived(
		cities.flatMap((city): CitySpot[] => {
			const spot = place(city.point);
			return spot ? [{ city, x: spot[0], y: spot[1] }] : [];
		})
	);
	let groups = $derived(groupCities(spots, radius));
	let labelled = $derived(labelledCities(groups, labelSize, selected));

	$effect(() => {
		if (width === 0 || height === 0 || frame?.key === fitKey) return;
		frame = { key: fitKey, width, height };
	});

	$effect(() => {
		void projection;
		untrack(() => zoom.reset());
	});

	$effect(() => {
		zoom.limit(mapBounds(projection), width, height);
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
		return narrow ? 7 + Math.sqrt(count) * 1.2 : 9 + Math.sqrt(count) * 1.5;
	}

	function labelSize(city: MapCity): { width: number; height: number } {
		const size = narrow ? 14 : 16;
		return { width: city.name.length * size * 0.5 + 8, height: size * 1.4 };
	}

	function open(group: CityGroup): void {
		if (group.cities.length === 1) onselect?.(group.cities[0]);
		else fanned = group.key;
	}

	function fold(): void {
		fanned = undefined;
	}

	function foldOnZoom(zoomed: boolean): void {
		if (zoomed) fold();
	}

	function tap(x: number, y: number): void {
		fold();
		pick(x, y);
	}

	function pick(x: number, y: number): void {
		if (!onpick) return;
		const [mapX, mapY] = zoom.toMap(x, y);
		const inverted = projection.invert?.([mapX, mapY]);
		if (!inverted) return;
		const round = (value: number): number => Math.round(value * 100000) / 100000;
		onpick({ latitude: round(inverted[1]), longitude: round(inverted[0]) });
	}

	function wheel(element: HTMLElement): () => void {
		const listener = (event: WheelEvent): void => pointer.wheel(event);
		element.addEventListener('wheel', listener, { passive: false });
		return () => element.removeEventListener('wheel', listener);
	}

	function zoomBy(factor: number): void {
		fold();
		zoom.zoomAt(width / 2, height / 2, factor);
	}
</script>

<div
	class="map"
	class:picking={onpick}
	class:small
	{@attach wheel}
	bind:clientHeight={height}
	bind:clientWidth={width}
>
	<svg
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
	{#each groups as group (group.key)}
		{#if group.key !== fanned}
			<CityMarker
				{group}
				labelled={labelled.has(group.key)}
				{narrow}
				onclick={() => open(group)}
				selected={group.cities.some((city) => city.key === selected)}
			/>
		{/if}
	{/each}
	{#each groups.filter((group) => group.key === fanned) as group (group.key)}
		<div class="fan">
			<CityFan
				cities={fanOut(group, spots, radius, (city) => labelSize(city).width)}
				{narrow}
				onselect={(city) => onselect?.(city)}
				{selected}
			/>
		</div>
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
		<IconButton
			icon={Plus}
			label={m.map.zoomIn}
			onclick={() => zoomBy(ZOOM_STEP)}
			tooltipPlacement="left"
			variant="plain"
		/>
		<IconButton
			icon={Minus}
			label={m.map.zoomOut}
			onclick={() => zoomBy(1 / ZOOM_STEP)}
			tooltipPlacement="left"
			variant="plain"
		/>
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

	.fan {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}

	.fan :global(button) {
		pointer-events: auto;
	}

	.zoom {
		position: absolute;
		z-index: 3;
		right: var(--spacing-2);
		bottom: var(--spacing-2);
		display: grid;
		background: color-mix(in srgb, var(--color-bg) 80%, transparent);
	}

	.zoom :global(.icon-button) {
		width: var(--spacing-8);
		height: var(--spacing-8);
	}
</style>
