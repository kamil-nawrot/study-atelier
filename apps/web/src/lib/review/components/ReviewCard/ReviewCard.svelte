<script lang="ts">
	import type { Snippet } from 'svelte';
	import { overlayScrollbar } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import ReviewArtwork from '#lib/review/components/ReviewArtwork/ReviewArtwork.svelte';

	type Props = {
		artwork?: WallArtwork;
		image?: { src?: string; srcset?: string; width?: number; height?: number };
		alt: string;
		credit?: string;
		compact?: boolean;
		questionFirst?: boolean;
		collapsed?: boolean;
		labelledby: string;
		stage?: Snippet;
		body: Snippet;
		actions?: Snippet;
		overlay?: Snippet;
	};

	let {
		artwork,
		image = artwork?.image,
		alt,
		credit,
		compact = false,
		questionFirst = false,
		collapsed = false,
		labelledby,
		stage,
		body,
		actions,
		overlay
	}: Props = $props();
</script>

<div class="card" class:compact class:question-first={questionFirst}>
	<div class="stage" class:collapsed={collapsed && !stage}>
		{#if stage}
			{@render stage()}
		{:else}
			<ReviewArtwork {alt} {artwork} {collapsed} {compact} {credit} {image} {overlay} />
		{/if}
	</div>

	<section class="panel" aria-labelledby={labelledby}>
		<div class="body" {@attach overlayScrollbar()}>
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
		--color-stage-bg: var(--color-bg);
		--color-stage-fg: var(--color-fg);
		--color-stage-fg-muted: var(--color-fg-muted);

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

	@media (max-width: 767.98px) {
		.compact .stage {
			padding: var(--spacing-4);
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
		z-index: 2;
		display: grid;
		gap: var(--spacing-3);
		padding: var(--spacing-4);
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	@media (max-width: 767.98px) {
		.card {
			grid-template-rows: auto 1fr;
			min-height: var(--artwork-max-height, 100svh);
		}

		.question-first {
			grid-template-rows: auto auto 1fr;
		}

		.question-first .panel {
			display: contents;
		}

		.question-first .body {
			order: -1;
			padding-bottom: 0;
		}

		.question-first .actions {
			align-self: end;
		}

		.collapsed {
			padding: var(--spacing-2) var(--spacing-4);
		}
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
