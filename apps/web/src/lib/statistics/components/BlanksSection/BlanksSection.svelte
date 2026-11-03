<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import BarList from '#lib/statistics/components/BarList/BarList.svelte';
	import { blanksOf } from '#lib/statistics/blanks/blanks.ts';
	import { wallHref } from '#lib/statistics/dimensions/dimensions.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		artworks: WallArtwork[];
	};

	let { artworks }: Props = $props();

	let rows = $derived(
		blanksOf(artworks).map((blank) => ({
			key: blank.kind,
			name: m.atelier.filters.missing[blank.kind],
			count: blank.count,
			href: wallHref({ missing: [blank.kind] })
		}))
	);
</script>

{#if rows.length > 0}
	<section aria-labelledby="statistics-blanks">
		<h2 id="statistics-blanks">{m.statistics.blanks.title}</h2>
		<p class="caption">{m.statistics.blanks.lead}</p>
		<BarList faint max={artworks.length} {rows} />
	</section>
{/if}

<style>
	section {
		display: grid;
		gap: var(--spacing-4);
	}

	h2 {
		padding-block-end: var(--spacing-2);
		border-block-end: var(--border-width-hairline) solid var(--color-tag);
	}
</style>
