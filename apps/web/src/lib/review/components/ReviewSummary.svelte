<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { Button, Icon } from '@study-atelier/ui';
	import ArtworkWall from '#lib/collection/components/ArtworkWall.svelte';
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
		</div>
	</header>

	{#each groups as group (group.rating)}
		<section aria-labelledby="review-group-{group.rating}">
			<details class="group" open={group.rating === 1}>
				<summary>
					<h2 id="review-group-{group.rating}">
						{m.review.groups[group.rating]}
						<span class="count">{group.artworks.length}</span>
					</h2>
					<Icon icon={ChevronDown} size="sm" />
				</summary>
				<ArtworkWall artworks={group.artworks} />
			</details>
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

	summary {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		width: fit-content;
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	.group[open] summary {
		margin-bottom: var(--spacing-4);
	}

	.group[open] summary :global(svg) {
		rotate: 180deg;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.count {
		min-width: 16px;
		padding: 0 var(--spacing-1);
		background: var(--color-fg);
		color: var(--color-bg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xs);
		text-align: center;
		font-variant-numeric: tabular-nums;
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

	@media (prefers-reduced-motion: no-preference) {
		summary :global(svg) {
			transition: rotate var(--duration-short) ease-out;
		}
	}
</style>
