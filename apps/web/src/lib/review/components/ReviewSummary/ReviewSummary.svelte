<script lang="ts">
	import BookA from '@lucide/svelte/icons/book-a';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import Target from '@lucide/svelte/icons/target';
	import { Button, Disclosure, Icon } from '@study-atelier/ui';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import RoundCareer from '#lib/career/components/RoundCareer/RoundCareer.svelte';
	import type { RankForm } from '#lib/profile/types/rank-form.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { ReviewRating } from '#lib/review/types/review-rating.ts';
	import type { SummaryGroup } from '#lib/review/types/summary-group.ts';

	type Score = { asked: number; right: number };

	type Props = {
		count: number;
		minutes: number;
		tomorrow: number;
		groups: SummaryGroup[];
		years?: { asked: number; hit: number };
		orders?: Score;
		definitions?: Score;
		notes?: Score;
		nextRound: number;
		free?: boolean;
		rankForm?: RankForm;
		freeOpen?: boolean;
		starting?: boolean;
		onnext: () => void;
		onfree?: () => void;
	};

	let {
		count,
		minutes,
		tomorrow,
		groups,
		years = { asked: 0, hit: 0 },
		orders = { asked: 0, right: 0 },
		definitions = { asked: 0, right: 0 },
		notes = { asked: 0, right: 0 },
		nextRound,
		free = false,
		rankForm,
		freeOpen = false,
		starting = false,
		onnext,
		onfree
	}: Props = $props();

	const RATINGS: readonly ReviewRating[] = [3, 2, 1];

	let sizes = $derived(
		RATINGS.map((rating) => ({
			rating,
			count: groups.find((group) => group.rating === rating)?.artworks.length ?? 0
		}))
	);
	let scores = $derived(
		[
			{ icon: Target, label: m.review.roundLines.years, right: years.hit, asked: years.asked },
			{ icon: ListOrdered, label: m.review.roundLines.orders, ...orders },
			{ icon: BookA, label: m.review.roundLines.definitions, ...definitions },
			{ icon: NotebookPen, label: m.review.roundLines.notes, ...notes }
		].filter((score) => score.asked > 0)
	);
</script>

<div class="summary">
	<header class="head">
		<div class="intro">
			<h1>{count > 0 ? m.review.roundTitle(count, minutes) : m.review.done}</h1>
			{#if count > 0}
				<div class="ratings">
					<span class="bar" aria-hidden="true">
						{#each sizes as size (size.rating)}
							<span style:flex-grow={size.count} class="segment rating-{size.rating}"></span>
						{/each}
					</span>
					<ul class="legend">
						{#each sizes as size (size.rating)}
							<li>
								<span class="swatch rating-{size.rating}" aria-hidden="true"></span>
								{m.review.groups[size.rating]}
								{size.count}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			<div class="facts">
				<ul class="lines">
					{#each scores as score (score.label)}
						<li>
							<Icon icon={score.icon} />
							<span
								>{score.label}
								<strong>{m.review.roundScore(score.right, score.asked)}</strong></span
							>
						</li>
					{/each}
					{#if free}
						<li><Icon icon={CalendarClock} /><span>{m.review.freePlan}</span></li>
					{:else if tomorrow > 0}
						<li>
							<Icon icon={CalendarClock} />
							<span>
								{m.review.tomorrowStart(tomorrow)}
								<strong>{tomorrow}</strong>
								{m.review.tomorrowEnd(tomorrow)}
							</span>
						</li>
					{/if}
				</ul>
				{#if !free && rankForm}
					<RoundCareer form={rankForm} />
				{/if}
			</div>
		</div>
		<div class="actions">
			{#if free}
				<Button disabled={starting} onclick={onfree} variant="primary">
					{starting ? m.review.preparing : m.review.freeNextRound}
				</Button>
			{:else if nextRound > 0}
				<Button disabled={starting} onclick={onnext} variant="primary">
					{starting ? m.review.preparing : m.review.nextRound(nextRound)}
				</Button>
			{:else if freeOpen}
				<Button disabled={starting} onclick={onfree} variant="primary">
					{starting ? m.review.preparing : m.review.free}
				</Button>
			{/if}
		</div>
	</header>

	{#each groups as group (group.rating)}
		<section aria-labelledby="review-group-{group.rating}">
			<Disclosure
				id="review-group-{group.rating}"
				count={group.artworks.length}
				open={group.rating === 1}
				title={m.review.groups[group.rating]}
			>
				<ArtworkWall artworks={group.artworks} />
			</Disclosure>
		</section>
	{/each}
</div>

<style>
	.summary {
		display: grid;
		gap: var(--spacing-8);
		width: 100%;
		max-width: var(--size-content-wide);
	}

	.head {
		display: grid;
		gap: var(--spacing-6);
		padding-bottom: var(--spacing-8);
		border-bottom: var(--border-width-base) solid var(--color-line);
	}

	.intro {
		display: grid;
		gap: var(--spacing-6);
	}

	h1 {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-3xl);
		font-style: italic;
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-3xl);
	}

	.ratings {
		display: grid;
		gap: var(--spacing-2);
		max-width: var(--size-content-narrow);
	}

	.bar {
		display: flex;
		gap: var(--border-width-hairline);
		height: var(--spacing-2);
	}

	.segment {
		flex-basis: 0;
	}

	.rating-3 {
		background: var(--color-fg);
	}

	.rating-2 {
		background: var(--color-fg-muted);
	}

	.rating-1 {
		background: var(--color-tag);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1) var(--spacing-6);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		list-style: none;
	}

	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.swatch {
		width: var(--spacing-2);
		height: var(--spacing-2);
	}

	.facts {
		display: grid;
		gap: var(--spacing-6) var(--spacing-12);
	}

	.lines {
		display: grid;
		gap: var(--spacing-2);
		list-style: none;
	}

	.lines li {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.lines li > :global(svg) {
		flex: none;
		color: var(--color-fg-muted);
	}

	.actions {
		display: grid;
		gap: var(--spacing-3);
	}

	@media (min-width: 768px) {
		.head {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: start;
		}

		.facts {
			grid-template-columns: repeat(2, minmax(0, max-content));
			align-items: start;
		}

		.actions {
			display: flex;
			flex-wrap: wrap;
		}
	}
</style>
