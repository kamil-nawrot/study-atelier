<script lang="ts">
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import ChoiceTitle from '#lib/review/components/ChoiceTitle/ChoiceTitle.svelte';
	import ArtworkRow from '#lib/review/components/ArtworkRow/ArtworkRow.svelte';
	import KnowledgeBar from '#lib/review/components/KnowledgeBar/KnowledgeBar.svelte';
	import type { AtelierKnowledge } from '#lib/review/types/atelier-knowledge.ts';

	type Props = {
		knowledge: AtelierKnowledge;
		troubles: WallArtwork[];
	};

	let { knowledge, troubles }: Props = $props();

	let total = $derived(knowledge.settled + knowledge.learning + knowledge.fresh);
</script>

{#if total > 0}
	<aside class="side" aria-labelledby="review-knowledge">
		<section class="knowledge">
			<ChoiceTitle id="review-knowledge" text={m.review.knowledge} />
			<KnowledgeBar {knowledge} />
		</section>
		{#if troubles.length > 0}
			<section class="troubles" aria-labelledby="review-troubles">
				<ChoiceTitle id="review-troubles" text={m.review.troubles} />
				<ul class="trouble-list">
					{#each troubles as artwork (artwork.id)}
						<li>
							<ArtworkRow {artwork} />
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</aside>
{/if}

<style>
	.side {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
	}

	.knowledge,
	.troubles {
		display: grid;
		gap: var(--spacing-4);
	}

	.trouble-list {
		display: grid;
		gap: var(--spacing-3);
		list-style: none;
	}
</style>
