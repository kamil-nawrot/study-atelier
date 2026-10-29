<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import { ArtworkImage, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		image?: { src?: string; srcset?: string; width?: number; height?: number };
		alt: string;
		count?: number;
		onstep?: (step: -1 | 1) => void;
	};

	let { image, alt, count = 1, onstep }: Props = $props();

	function stepOnArrow(event: KeyboardEvent): void {
		if (count < 2) return;
		if (event.key === 'ArrowLeft') onstep?.(-1);
		else if (event.key === 'ArrowRight') onstep?.(1);
		else return;
		event.preventDefault();
	}

	let viewer: HTMLDialogElement;
	let used = $state(false);

	export function open(): void {
		used = true;
		viewer.showModal();
	}
</script>

<dialog bind:this={viewer} class="viewer" aria-label={alt} onkeydown={stepOnArrow}>
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
	{#if count > 1}
		<button
			class="step previous"
			aria-label={m.artworkView.previousImage}
			onclick={() => onstep?.(-1)}
			type="button"
		>
			<Icon icon={ChevronLeft} />
		</button>
		<button
			class="step next"
			aria-label={m.artworkView.nextImage}
			onclick={() => onstep?.(1)}
			type="button"
		>
			<Icon icon={ChevronRight} />
		</button>
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

	.step {
		position: absolute;
		top: 50%;
		display: flex;
		align-items: center;
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-stage-fg);
		cursor: pointer;
		translate: 0 -50%;
	}

	.step.previous {
		left: var(--spacing-3);
	}

	.step.next {
		right: var(--spacing-3);
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
