<script lang="ts">
	import { Tabs } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import BarList from '#lib/statistics/components/BarList/BarList.svelte';
	import { wallHref, type Dimension } from '#lib/statistics/dimensions/dimensions.ts';
	import { rankingOf } from '#lib/statistics/rankings/rankings.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		artworks: WallArtwork[];
		dimensions: Dimension[];
	};

	let { artworks, dimensions }: Props = $props();

	type Kind = keyof typeof texts.tabs;

	const texts = m.statistics.foreground;
	const KINDS: Kind[] = ['authors', 'locations', 'styles', 'materials'];

	let kind = $state<Kind>('authors');

	let dimension = $derived(dimensions.find((candidate) => candidate.key === kind) as Dimension);
	let ranking = $derived(rankingOf(artworks, dimension));
	let rows = $derived(
		(ranking?.top ?? []).map((row, index) => ({
			key: row.value,
			name: `${index + 1}. ${dimension.nameOf(row.value)}`,
			count: row.count,
			href: wallHref(dimension.filterOf(row.value))
		}))
	);
</script>

<section aria-labelledby="statistics-foreground">
	<h2 id="statistics-foreground">{texts.title}</h2>
	<Tabs
		label={texts.tabsLabel}
		tabs={KINDS.map((value) => ({ value, label: texts.tabs[value] }))}
		bind:value={() => kind, (value) => (kind = value as Kind)}
	>
		<div class="tab">
			{#if ranking}
				<BarList {rows} />
				<p class="caption">{texts.single(ranking.single, ranking.values, texts.kinds[kind])}</p>
			{:else}
				<p class="caption">{texts.tooEarly[kind]}</p>
			{/if}
		</div>
	</Tabs>
</section>

<style>
	section {
		display: grid;
		gap: var(--spacing-4);
	}

	h2 {
		padding-block-end: var(--spacing-2);
		border-block-end: var(--border-width-hairline) solid var(--color-tag);
	}

	.tab {
		display: grid;
		gap: var(--spacing-4);
		padding-block-start: var(--spacing-4);
	}
</style>
