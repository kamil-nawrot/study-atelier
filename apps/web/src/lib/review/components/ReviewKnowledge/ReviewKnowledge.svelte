<script lang="ts">
	import { resolve } from '$app/paths';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { authorsOf } from '#lib/review/overview/overview.ts';
	import type { AtelierKnowledge } from '#lib/review/types/atelier-knowledge.ts';

	type Props = {
		knowledge: AtelierKnowledge;
		troubles: WallArtwork[];
	};

	let { knowledge, troubles }: Props = $props();

	const GROUPS = ['settled', 'learning', 'fresh'] as const;

	let total = $derived(knowledge.settled + knowledge.learning + knowledge.fresh);
</script>

{#if total > 0}
	<aside class="side" aria-labelledby="review-knowledge">
		<section class="knowledge">
			<h2 id="review-knowledge" class="choice-title">{m.review.knowledge}</h2>
			<span class="bar" aria-hidden="true">
				{#each GROUPS as group (group)}
					<span style:flex-grow={knowledge[group]} class="segment {group}"></span>
				{/each}
			</span>
			<dl class="groups">
				{#each GROUPS as group (group)}
					<div class="group">
						<dt>
							<span class="swatch {group}" aria-hidden="true"></span>
							{m.review.knowledgeGroups[group].label}
						</dt>
						<dd class="number">{knowledge[group]}</dd>
						<dd class="caption hint">{m.review.knowledgeGroups[group].hint}</dd>
					</div>
				{/each}
			</dl>
		</section>
		{#if troubles.length > 0}
			<section class="troubles" aria-labelledby="review-troubles">
				<h2 id="review-troubles" class="choice-title">{m.review.troubles}</h2>
				<ul class="trouble-list">
					{#each troubles as artwork (artwork.id)}
						<li>
							<a
								class="trouble"
								href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
							>
								<span class="thumbnail">
									{#if artwork.image?.src}
										<img
											alt=""
											loading="lazy"
											sizes="64px"
											src={artwork.image.src}
											srcset={artwork.image.srcset}
										/>
									{/if}
								</span>
								<span class="trouble-text">
									<cite class="artwork-title">{artwork.title}</cite>
									<span class="caption">{authorsOf(artwork)}</span>
								</span>
							</a>
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

	.bar {
		display: flex;
		gap: var(--border-width-hairline);
		height: var(--spacing-2);
	}

	.segment {
		flex-basis: 0;
	}

	.settled {
		background: var(--color-fg);
	}

	.learning {
		background: var(--color-fg-muted);
	}

	.fresh {
		background: var(--color-tag);
	}

	.groups {
		display: grid;
		gap: var(--spacing-3);
	}

	.group {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0 var(--spacing-4);
		align-items: baseline;
	}

	dt {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.swatch {
		flex: none;
		width: var(--spacing-2);
		height: var(--spacing-2);
	}

	.number {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		font-variant-numeric: tabular-nums;
	}

	.hint {
		grid-column: 1 / -1;
		padding-left: var(--spacing-4);
	}

	.trouble-list {
		display: grid;
		gap: var(--spacing-3);
		padding: 0;
		list-style: none;
	}

	.trouble {
		display: grid;
		grid-template-columns: var(--spacing-16) minmax(0, 1fr);
		gap: var(--spacing-3);
		align-items: center;
		color: inherit;
		text-decoration: none;
	}

	.thumbnail {
		display: block;
		aspect-ratio: 1;
		padding: var(--spacing-1);
		overflow: hidden;
		background: var(--color-mat-bg);
	}

	.thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.trouble-text {
		display: grid;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.trouble-text > * {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.trouble:hover .artwork-title {
		text-decoration: underline;
	}
</style>
