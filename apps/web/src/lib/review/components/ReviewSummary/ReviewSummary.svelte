<script lang="ts">
	import { Button, Disclosure } from '@study-atelier/ui';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import type { SummaryGroup } from '#lib/review/types/summary-group.ts';

	type Props = {
		count: number;
		minutes: number;
		tomorrow: number;
		groups: SummaryGroup[];
		nextRound: number;
		free?: boolean;
		freeOpen?: boolean;
		onnext: () => void;
		onfree?: () => void;
	};

	let {
		count,
		minutes,
		tomorrow,
		groups,
		nextRound,
		free = false,
		freeOpen = false,
		onnext,
		onfree
	}: Props = $props();
</script>

<div class="summary">
	<header class="head">
		<div class="intro">
			<h1>{m.review.done}</h1>
			<p class="lead">
				{free ? m.review.freeSummary(count, minutes) : m.review.summary(count, minutes, tomorrow)}
			</p>
		</div>
		<div class="actions">
			{#if free}
				<Button onclick={onfree} variant="primary">{m.review.freeNextRound}</Button>
			{:else if nextRound > 0}
				<Button onclick={onnext} variant="primary">{m.review.nextRound(nextRound)}</Button>
			{:else if freeOpen}
				<Button onclick={onfree} variant="primary">{m.review.free}</Button>
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
	}

	.intro {
		display: grid;
		gap: var(--spacing-2);
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

		.actions {
			display: flex;
			flex-wrap: wrap;
		}
	}
</style>
