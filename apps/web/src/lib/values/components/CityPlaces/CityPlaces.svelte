<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import CardIndexPlaceRows from '#lib/card-index/components/CardIndexPlaceRows/CardIndexPlaceRows.svelte';
	import type { CardIndexPlace } from '#lib/card-index/types/card-index-place.ts';

	type Props = {
		places: CardIndexPlace[];
	};

	let { places }: Props = $props();
</script>

<section class="city-places" aria-labelledby="city-places-title">
	<h2 id="city-places-title" class="title">{m.valuePage.city.places}</h2>
	<CardIndexPlaceRows {places} />
</section>

<style>
	.city-places {
		display: grid;
		gap: var(--spacing-2);
		max-width: 48rem;
	}

	.title {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		font-variant-caps: all-small-caps;
		letter-spacing: var(--letter-spacing-wide);
		line-height: var(--line-height-sm);
	}
</style>
