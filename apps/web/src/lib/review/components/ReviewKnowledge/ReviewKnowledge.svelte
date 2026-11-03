<script lang="ts">
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
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
			<h2 id="review-knowledge" class="choice-title">{m.review.knowledge}</h2>
			<KnowledgeBar {knowledge} />
		</section>
		{#if troubles.length > 0}
			<section class="troubles" aria-labelledby="review-troubles">
				<h2 id="review-troubles" class="choice-title">{m.review.troubles}</h2>
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
	.choice-title {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

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
		padding: 0;
		list-style: none;
	}
</style>
