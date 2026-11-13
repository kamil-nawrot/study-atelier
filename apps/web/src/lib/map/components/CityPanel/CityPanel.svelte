<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { Button, IconButton, MetaLine } from '@study-atelier/ui';
	import { countryName, isCountryCode } from '#lib/catalogue/countries/countries.ts';
	import { placeTypeName } from '#lib/catalogue/place-types/place-types.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import CityThumb from '#lib/map/components/CityThumb/CityThumb.svelte';
	import { cityWallHref } from '#lib/map/city-wall/city-wall.ts';
	import type { MapCity } from '#lib/map/types/map-city.ts';
	import type { MapFilter } from '#lib/map/types/map-filter.ts';
	import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';

	type Props = {
		city: MapCity;
		filter: MapFilter;
		images: WallImages;
		onclose: () => void;
	};

	let { city, filter, images, onclose }: Props = $props();

	let country = $derived(isCountryCode(city.countryCode) ? countryName(city.countryCode) : null);
</script>

<section class="panel" aria-labelledby="city-name">
	<header>
		<div class="heading">
			{#if country}
				<p class="overline">{country}</p>
			{/if}
			<h2 id="city-name">{city.name}</h2>
			<p class="caption">{m.map.city.summary(city.places.length, city.count, city.seen)}</p>
		</div>
		<IconButton
			icon={X}
			label={m.map.city.close}
			onclick={onclose}
			tooltipAlign="end"
			tooltipPlacement="bottom"
			variant="plain"
		/>
	</header>
	<ul>
		{#each city.places as { place, artworks } (place.id)}
			<li>
				<span class="name">{place.name}</span>
				<span class="caption">
					<MetaLine
						parts={[
							place.placeType ? placeTypeName(place.placeType) : null,
							m.map.city.artworks(artworks.length)
						]}
					/>
				</span>
				<div class="thumbs">
					{#each artworks as artwork (artwork.id)}
						<CityThumb {artwork} {images} />
					{/each}
				</div>
			</li>
		{/each}
	</ul>
	<Button href={cityWallHref(city, filter)}>
		{m.map.city.showOnWall}
	</Button>
</section>

<style>
	.panel {
		display: grid;
		align-content: start;
		gap: var(--spacing-4);
	}

	header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: var(--spacing-4);
	}

	.heading {
		display: grid;
		gap: var(--spacing-1);
	}

	h2 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-2xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-2xl);
	}

	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	ul {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-3) 0;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.name {
		font-size: var(--font-size-md);
	}

	.thumbs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}
</style>
