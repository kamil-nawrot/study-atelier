<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import ArtworkRow from '#lib/review/components/ArtworkRow/ArtworkRow.svelte';
	import KnowledgeBar from '#lib/review/components/KnowledgeBar/KnowledgeBar.svelte';
	import { atelierKnowledge } from '#lib/review/overview/overview.ts';
	import { mostForgotten, mostReviewed, mostStable } from '#lib/statistics/memory/memory.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ReviewCard } from '#lib/review/types/review-card.ts';
	import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

	type Props = {
		artworks: WallArtwork[];
		cards: Map<string, ReviewCard>;
		statistics: CollectionStatistics;
		now?: Date;
	};

	let { artworks, cards, statistics, now = new Date() }: Props = $props();

	const QUIZ_SHARE_FROM = 20;
	const texts = m.statistics.memory;
	const images = new WallImages();

	let knowledge = $derived(atelierKnowledge(artworks, cards));
	let reviewed = $derived(mostReviewed(artworks, statistics.mostReviewed));
	let forgotten = $derived(mostForgotten(artworks, cards));
	let stable = $derived(mostStable(artworks, cards, now));

	$effect(() => {
		for (const { artwork } of [...reviewed, ...forgotten]) images.request(artwork);
	});

	function shown(artwork: WallArtwork): WallArtwork {
		return images.apply([artwork])[0];
	}
</script>

<section aria-labelledby="statistics-memory">
	<h2 id="statistics-memory">{texts.title}</h2>
	{#if cards.size === 0}
		<p class="caption">{texts.noCards}</p>
	{:else}
		<div class="knowledge"><KnowledgeBar {knowledge} /></div>
		{#if statistics.quizAnswers >= QUIZ_SHARE_FROM}
			<div class="share">
				<span class="caption">{texts.quiz}</span>
				<span class="big"
					>{Math.round((100 * statistics.correctAnswers) / statistics.quizAnswers)}%</span
				>
				<span class="caption"
					>{texts.quizShare(statistics.correctAnswers, statistics.quizAnswers)}</span
				>
			</div>
		{:else}
			<p class="caption">{texts.quizLater(statistics.quizAnswers)}</p>
		{/if}
		{#if reviewed.length > 0 || forgotten.length > 0}
			<div class="lists">
				{#each [{ title: texts.mostReviewed, rows: reviewed }, { title: texts.forgotten, rows: forgotten }] as list (list.title)}
					{#if list.rows.length > 0}
						<div class="list">
							<h3>{list.title}</h3>
							<ul>
								{#each list.rows as row (row.artwork.id)}
									<li>
										<ArtworkRow artwork={shown(row.artwork)} detail={texts.times(row.count)} />
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
		{#if stable}
			<p class="caption">
				{texts.stable}<a
					href={resolve('/(app)/atelier/[number]', { number: String(stable.artwork.number) })}
					><cite class="artwork-title">{stable.artwork.title}</cite></a
				>{texts.stableIn(stable.days)}
			</p>
		{/if}
	{/if}
</section>

<style>
	section {
		display: grid;
		gap: var(--spacing-6);
	}

	h2 {
		padding-block-end: var(--spacing-2);
		border-block-end: var(--border-width-hairline) solid var(--color-tag);
	}

	.knowledge {
		display: grid;
		gap: var(--spacing-4);
	}

	.share {
		display: grid;
		gap: var(--spacing-1);
	}

	.big {
		font-size: var(--font-size-2xl);
		font-weight: var(--font-weight-bold);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-xl);
	}

	.lists {
		display: grid;
		gap: var(--spacing-6) var(--spacing-8);
	}

	.list {
		display: grid;
		align-content: start;
		gap: var(--spacing-3);
	}

	ul {
		display: grid;
		gap: var(--spacing-3);
		list-style: none;
	}

	@media (min-width: 768px) {
		.lists {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
