<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { ARTWORK_TYPE_CODES } from '#lib/catalogue/artwork-types/artwork-types.ts';
	import { formatDate, formatLifeYears, yearsBetween } from '#lib/catalogue/years/years.ts';
	import { visitDateName } from '#lib/chronicle/visit-date/visit-date.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { wallHref } from '#lib/statistics/dimensions/dimensions.ts';
	import { odditiesOf, type ArtworkOddity } from '#lib/statistics/oddities/oddities.ts';
	import type { DatePrecision } from '#lib/chronicle/types/date-precision.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

	type Props = {
		artworks: WallArtwork[];
		statistics: CollectionStatistics;
	};

	type Item = {
		label: string;
		name: string;
		href?: ResolvedPathname;
		artwork: boolean;
		caption: string;
	};

	let { artworks, statistics }: Props = $props();

	const texts = m.statistics.oddities;

	function withTie(caption: string, tied: number, tie: (count: number) => string): string {
		return tied > 0 ? `${caption}, ${tie(tied)}` : caption;
	}

	function artworkItem(label: string, oddity: ArtworkOddity, caption: string): Item {
		return {
			label,
			name: oddity.artwork.title,
			href: resolve('/(app)/atelier/[number]', { number: String(oddity.artwork.number) }),
			artwork: true,
			caption: withTie(caption, oddity.tied, texts.tiedArtworks)
		};
	}

	function authorItem(label: string, author: string, caption: string, tied: number): Item {
		return {
			label,
			name: author,
			href: wallHref({ authors: [author] }),
			artwork: false,
			caption: withTie(caption, tied, texts.tiedAuthors)
		};
	}

	let oddities = $derived(odditiesOf(artworks, ARTWORK_TYPE_CODES));
	let dated = $derived(oddities.oldest !== undefined);

	let items = $derived.by((): Item[] => {
		const list: Item[] = [];
		const { oldest, newest, longestBuilt, versatile, materials } = oddities;
		const date = (artwork: WallArtwork): string =>
			formatDate(artwork.yearFrom, artwork.yearTo, false) ?? '';
		if (oldest) list.push(artworkItem(texts.oldest, oldest, date(oldest.artwork)));
		if (newest) list.push(artworkItem(texts.newest, newest, date(newest.artwork)));
		if (longestBuilt)
			list.push(
				artworkItem(
					texts.longestBuilt,
					longestBuilt,
					`${date(longestBuilt.artwork)}, ${texts.years(longestBuilt.value)}`
				)
			);
		const lived = statistics.longestLived;
		if (lived && statistics.authorsWithYears >= 2)
			list.push(
				authorItem(
					texts.longestLived,
					lived.name,
					`${formatLifeYears(lived.birthYear, lived.deathYear, lived.yearsApproximate)}, ${texts.years(yearsBetween(lived.birthYear, lived.deathYear))}`,
					lived.tied
				)
			);
		if (versatile)
			list.push(
				authorItem(
					texts.versatile,
					versatile.author,
					texts.list(versatile.types.map((type) => m.artworkTypes[type].toLocaleLowerCase('pl'))),
					versatile.tied
				)
			);
		if (materials)
			list.push(
				authorItem(
					texts.materials,
					materials.author,
					texts.materialCount(materials.value),
					materials.tied
				)
			);
		const pinned = statistics.mostPinned;
		const pinnedArtwork = pinned && artworks.find((artwork) => artwork.id === pinned.artworkId);
		if (pinned && pinnedArtwork && pinned.pins >= 2)
			list.push(
				artworkItem(
					texts.pins,
					{ artwork: pinnedArtwork, value: pinned.pins, tied: pinned.tied },
					texts.pinCount(pinned.pins)
				)
			);
		const visit = statistics.largestVisit;
		if (visit && visit.artworks >= 2)
			list.push({
				label: texts.visit,
				name: visit.place,
				href: resolve('/(app)/atelier/chronicle/[id]', { id: visit.visitId }),
				artwork: false,
				caption: withTie(
					`${visitDateName({ on: visit.visitedOn, precision: visit.datePrecision as DatePrecision })}, ${texts.artworkCount(visit.artworks)}`,
					visit.tied,
					texts.tiedVisits
				)
			});
		return list;
	});
</script>

<section aria-labelledby="statistics-oddities">
	<h2 id="statistics-oddities">{texts.title}</h2>
	{#if items.length === 0}
		<p class="caption">{texts.noneYet}</p>
	{:else}
		<dl>
			{#each items as item (item.label)}
				<div>
					<dt>{item.label}</dt>
					<dd>
						{#if item.artwork}
							<a href={item.href}><cite class="artwork-title">{item.name}</cite></a>
						{:else}
							<a href={item.href}>{item.name}</a>
						{/if}
					</dd>
					<dd class="caption">{item.caption}</dd>
				</div>
			{/each}
		</dl>
		{#if !dated}
			<p class="caption">{texts.datesLater}</p>
		{/if}
	{/if}
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

	dl {
		display: grid;
		gap: var(--spacing-6) var(--spacing-8);
	}

	div {
		display: grid;
		align-content: start;
		gap: var(--spacing-1);
	}

	dt {
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
		color: var(--color-fg-muted);
	}

	@media (min-width: 768px) {
		dl {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
