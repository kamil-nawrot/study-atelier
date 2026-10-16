<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { ArtworkImage, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		image?: { src?: string; srcset?: string; width?: number; height?: number };
		alt: string;
	};

	let { image, alt }: Props = $props();

	let viewer: HTMLDialogElement;
	let used = $state(false);

	export function open(): void {
		used = true;
		viewer.showModal();
	}
</script>

<dialog bind:this={viewer} class="viewer" aria-label={alt}>
	{#if used && image?.src}
		<ArtworkImage
			{alt}
			height={image.height}
			sizes="100vw"
			src={image.src}
			srcset={image.srcset}
			surface="stage"
			width={image.width}
		/>
	{/if}
	<button
		class="close"
		aria-label={m.artworkView.closeImage}
		onclick={() => viewer.close()}
		type="button"
	>
		<Icon icon={X} />
	</button>
</dialog>

<style>
	.viewer {
		width: 100vw;
		max-width: none;
		height: 100dvh;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		background: var(--color-stage-bg);
	}

	.viewer[open] {
		display: grid;
		place-items: center;
	}

	.viewer :global(img) {
		display: block;
		width: auto;
		height: auto;
		max-width: 100vw;
		max-height: 100dvh;
	}

	.close {
		position: absolute;
		top: var(--spacing-3);
		right: var(--spacing-3);
		display: flex;
		align-items: center;
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-stage-fg);
		cursor: pointer;
	}
</style>
