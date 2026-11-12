<script lang="ts">
	import type { Snippet } from 'svelte';
	import StageBackdrop from '../StageBackdrop/StageBackdrop.svelte';

	type Props = {
		ratio?: number;
		backdrop?: string;
		capped?: boolean;
		children: Snippet;
	};

	let { ratio, backdrop, capped = $bindable(false), children }: Props = $props();

	let width = $state(0);
	let maxHeight = $state(0);

	$effect(() => {
		capped = ratio !== undefined && maxHeight > 0 && width / ratio > maxHeight + 1;
	});
</script>

<span style:--picture-ratio={ratio} class="capped-picture" class:capped bind:clientWidth={width}>
	<span class="probe" bind:clientHeight={maxHeight}></span>
	{#if capped && backdrop}
		<StageBackdrop src={backdrop} />
	{/if}
	<span class="picture">
		{@render children()}
	</span>
</span>

<style>
	.capped-picture {
		--color-stage-bg: var(--color-bg);

		position: relative;
		display: block;
		width: 100%;
		overflow: clip;
	}

	.probe {
		position: absolute;
		width: 0;
		height: var(--picture-max-height, 0px);
		visibility: hidden;
	}

	.picture {
		position: relative;
		display: block;
		width: min(100%, calc(var(--picture-max-height, 100000px) * var(--picture-ratio, 1)));
		margin-inline: auto;
	}

	.capped .picture {
		box-sizing: border-box;
		width: min(
			100%,
			calc(
				(var(--picture-max-height) - 2 * var(--spacing-2)) * var(--picture-ratio) + 2 *
					var(--spacing-2)
			)
		);
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.picture :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}

	.capped .picture :global(img) {
		width: 100%;
		max-height: none;
	}
</style>
