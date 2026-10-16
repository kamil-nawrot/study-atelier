<script lang="ts">
	import { ArtworkTile, Button } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/index.ts';
	import type { SummaryGroup } from '../overview.ts';

	type Props = {
		count: number;
		minutes: number;
		tomorrow: number;
		groups: SummaryGroup[];
		nextRound: number;
		onnext: () => void;
	};

	let { count, minutes, tomorrow, groups, nextRound, onnext }: Props = $props();
</script>

<div class="summary">
	<header class="head">
		<div class="intro">
			<h1>{m.review.done}</h1>
			<p class="lead">{m.review.summary(count, minutes, tomorrow)}</p>
		</div>
		<div class="actions">
			{#if nextRound > 0}
				<Button onclick={onnext} variant="primary">{m.review.nextRound(nextRound)}</Button>
			{/if}
			<Button href={resolve('/(app)/atelier')}>{m.review.backToAtelier}</Button>
		</div>
	</header>

	{#each groups as group (group.rating)}
		<section class="group" aria-labelledby="review-group-{group.rating}">
			<h2 id="review-group-{group.rating}">
				{m.review.groups[group.rating]}
				<span class="caption">{group.artworks.length}</span>
			</h2>
			<ul class="tiles">
				{#each group.artworks as artwork (artwork.id)}
					<li>
						<ArtworkTile
							authors={artwork.authors}
							date={artwork.date}
							href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
							image={artwork.image}
							imageUnavailable={artwork.imageUnavailable}
							number={artwork.number}
							title={artwork.title}
						/>
					</li>
				{/each}
			</ul>
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

	.group {
		display: grid;
		gap: var(--spacing-4);
	}

	h2 {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-2);
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
		gap: var(--spacing-4);
		padding: 0;
		list-style: none;
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

		.tiles {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		}
	}
</style>
