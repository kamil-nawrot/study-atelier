<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ArtworkImage, NoImage } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		artwork: WallArtwork;
		alt: string;
		credit?: string;
		compact?: boolean;
		labelledby: string;
		stage?: Snippet;
		body: Snippet;
		actions?: Snippet;
	};

	let { artwork, alt, credit, compact = false, labelledby, stage, body, actions }: Props = $props();
</script>

<div class="card" class:compact>
	{#if stage}
		<div class="stage">
			{@render stage()}
		</div>
	{:else}
		<figure class="stage" class:dimmed={artwork.image?.src !== undefined}>
			{#if artwork.image?.src}
				<img class="backdrop" alt="" aria-hidden="true" src={artwork.image.src} />
				<span class="mat">
					<ArtworkImage
						{alt}
						height={artwork.image.height}
						loading="eager"
						sizes="(min-width: 768px) 60vw, 100vw"
						src={artwork.image.src}
						srcset={artwork.image.srcset}
						width={artwork.image.width}
					/>
				</span>
			{:else if artwork.imageUnavailable}
				<span class="mat">
					<ArtworkImage {alt} unavailable />
				</span>
			{:else}
				<span class="mat">
					<span class="window">
						<NoImage label={m.ui.noImage} />
					</span>
				</span>
			{/if}
			<figcaption class="caption">{credit}</figcaption>
		</figure>
	{/if}

	<section class="panel" aria-labelledby={labelledby}>
		<div class="body">
			{@render body()}
		</div>
		{#if actions}
			<div class="actions">
				{@render actions()}
			</div>
		{/if}
	</section>
</div>

<style>
	.card {
		display: grid;
	}

	.stage {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: center;
		gap: var(--spacing-3);
		padding: var(--spacing-6) var(--spacing-4);
		overflow: hidden;
		background: var(--color-stage-bg);
		color: var(--color-stage-fg-muted);
	}

	.dimmed::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-scrim);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(32px);
		scale: 1.2;
	}

	.stage > :not(.backdrop) {
		position: relative;
		z-index: 1;
	}

	.mat {
		display: block;
		max-width: 100%;
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.mat :global(img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 50dvh;
		background: var(--color-mat-window);
	}

	@media (max-width: 767.98px) {
		.compact .mat :global(img) {
			max-height: 35dvh;
		}
	}

	.window {
		display: grid;
		width: min(320px, calc(100vw - 2 * var(--spacing-6)));
		aspect-ratio: 4 / 5;
	}

	.caption {
		min-height: 1lh;
		color: var(--color-stage-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	@media (max-width: 767.98px) {
		.caption {
			min-height: 2lh;
		}
	}

	.panel {
		display: grid;
		grid-template-rows: 1fr auto;
	}

	.body {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		padding: var(--spacing-6) var(--spacing-4);
	}

	.actions {
		position: sticky;
		bottom: 0;
		display: grid;
		gap: var(--spacing-3);
		padding: var(--spacing-4);
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	@media (min-width: 768px) {
		.card {
			grid-template-columns: minmax(0, 1fr) 380px;
			grid-template-rows: minmax(0, 1fr);
			height: 100%;
			min-height: 0;
		}

		.stage {
			container-type: size;
			padding: var(--spacing-6);
		}

		.mat {
			padding: var(--spacing-4) var(--spacing-4) var(--spacing-6);
		}

		.mat :global(img) {
			max-width: calc(100cqw - 2 * var(--spacing-4));
			max-height: calc(100cqh - var(--spacing-12) - var(--spacing-8));
		}

		.window {
			width: auto;
			height: calc(100cqh - var(--spacing-24) - var(--spacing-12));
		}

		.panel {
			min-height: 0;
			border-left: var(--border-width-hairline) solid var(--color-tag);
		}

		.body {
			overflow-y: auto;
			padding: var(--spacing-8) var(--spacing-6);
		}

		.actions {
			position: static;
			padding: var(--spacing-6);
			border-top: none;
		}
	}
</style>
