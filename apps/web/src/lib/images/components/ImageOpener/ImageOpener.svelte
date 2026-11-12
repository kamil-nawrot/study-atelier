<script lang="ts">
	import ImageViewer from '#lib/images/components/ImageViewer/ImageViewer.svelte';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		alt: string;
		image: { src?: string; srcset?: string; width?: number; height?: number };
	};

	let { alt, image }: Props = $props();

	let viewer = $state<ReturnType<typeof ImageViewer>>();
</script>

<button
	class="open"
	aria-label={m.artworkView.openImage}
	onclick={() => viewer?.open()}
	type="button"
></button>
<ImageViewer bind:this={viewer} {alt} {image} />

<style>
	.open {
		position: absolute;
		inset: 0;
		padding: 0;
		border: none;
		background: none;
		cursor: var(--cursor-zoom-in);
	}

	.open:focus-visible {
		outline: var(--border-width-base) dashed var(--color-mat-fg);
		outline-offset: calc(-1 * var(--spacing-2));
	}
</style>
