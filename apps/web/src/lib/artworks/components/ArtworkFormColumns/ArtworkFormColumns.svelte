<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		actionsHeight: number;
		onfocusin: (event: FocusEvent) => void;
		head: Snippet;
		images: Snippet;
		fields: Snippet;
	};

	let { actionsHeight, onfocusin, head, images, fields }: Props = $props();
</script>

<div style:--actions-height="{actionsHeight}px" class="columns" data-bleed {onfocusin}>
	<div class="fields head">
		{@render head()}
	</div>

	<div class="images">
		{@render images()}
	</div>

	<div class="fields">
		{@render fields()}
	</div>
</div>

<style>
	.columns {
		display: grid;
		gap: var(--spacing-8);
	}

	.fields {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		min-width: 0;
	}

	.images {
		position: relative;
		left: calc(-1 * var(--page-inline));
		display: grid;
		order: -1;
		width: calc(100% + 2 * var(--page-inline));
	}

	@media (min-width: 768px) {
		.columns {
			position: relative;
			left: calc(-1 * var(--content-bleed));
			grid-template: 'images head' auto 'images fields' 1fr / minmax(0, 1fr) minmax(0, 1fr);
			gap: var(--spacing-6) 0;
			width: calc(100% + 2 * var(--content-bleed));
		}

		.images {
			position: sticky;
			top: var(--bar-height);
			grid-area: images;
			align-self: start;
			width: auto;
			height: calc(100dvh - var(--bar-height) - var(--actions-height));
		}

		.head {
			grid-area: head;
			padding-top: var(--spacing-8);
		}

		.fields:not(.head) {
			grid-area: fields;
			padding-bottom: var(--spacing-8);
		}

		.fields {
			box-sizing: content-box;
			max-width: var(--size-content-default);
			padding-inline: var(--spacing-12) min(var(--content-bleed), var(--spacing-12));
		}

		:global(form):has(> .columns) {
			row-gap: 0;
		}

		:global(*) + .columns {
			padding-top: var(--spacing-6);
		}
	}
</style>
