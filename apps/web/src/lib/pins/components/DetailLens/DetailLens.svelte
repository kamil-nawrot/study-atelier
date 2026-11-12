<script lang="ts">
	import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';

	type Props = {
		lens: FragmentLens;
	};

	let { lens }: Props = $props();

	let failed = $state(false);
	let thumbnail = $derived(lens.thumbnail);

	$effect.pre(() => {
		void lens.crop;
		failed = false;
	});
</script>

<span class="lens">
	{#if lens.crop && !failed}
		<img alt="" onerror={() => (failed = true)} src={lens.crop} />
	{:else if thumbnail.src}
		<img
			style:left="{thumbnail.left}%"
			style:top="{thumbnail.top}%"
			style:width="{thumbnail.width}%"
			style:height="{thumbnail.height}%"
			class="view"
			alt=""
			src={thumbnail.src}
		/>
	{/if}
	<svg class="ring" aria-hidden="true" viewBox="0 0 100 100">
		<circle cx="50" cy="50" r="49" />
	</svg>
</span>

<style>
	.lens {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		width: var(--detail-lens);
		height: var(--detail-lens);
		background: var(--color-mat-window);
		clip-path: circle(50%);
	}

	.ring {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		fill: none;
		stroke: var(--detail-lens-ring, var(--color-line));
		stroke-width: var(--border-width-hairline);
		vector-effect: non-scaling-stroke;
	}

	.lens > img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.lens > img.view {
		position: absolute;
		max-width: none;
		object-fit: fill;
	}
</style>
