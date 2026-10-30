<script lang="ts">
	import type { Snippet } from 'svelte';
	import { asset } from '$app/paths';
	import TierNumeral from '#lib/career/components/TierNumeral/TierNumeral.svelte';
	import { artOf, imageOf } from '#lib/career/exhibit-art/exhibit-art.ts';
	import type { Metal } from '#lib/career/types/metal.ts';

	type Props = {
		code: string;
		metal: Metal;
		numeral?: string;
		children?: Snippet;
	};

	let { code, metal, numeral, children }: Props = $props();
</script>

<div class="frame {metal}">
	<div class="picture">
		{#if artOf(code)}
			<img class="engraving" alt="" src={asset(imageOf(code, metal))} />
		{/if}
		<span class="light"></span>
		{#if numeral}
			<TierNumeral {metal} {numeral} />
		{/if}
	</div>
	{#if children}
		<div class="corner">{@render children()}</div>
	{/if}
</div>

<style>
	.frame {
		--frame-scale: 0.67;
		position: relative;
		display: grid;
		aspect-ratio: 10 / 13;
		border-style: solid;
		border-color: transparent;
		border-width: calc(var(--frame-width) * var(--frame-scale));
		border-image-repeat: stretch;
		background: var(--color-stage-bg);
	}

	.none {
		--frame-width: calc(var(--spacing-1) * 1.75);
		border-image-source: url('/exhibits/frames/none.png');
		border-image-slice: 14;
	}

	.bronze {
		--frame-width: var(--spacing-3);
		border-image-source: url('/exhibits/frames/bronze.png');
		border-image-slice: 24;
	}

	.silver {
		--frame-width: calc(var(--spacing-3) + var(--border-width-base));
		border-image-source: url('/exhibits/frames/silver.png');
		border-image-slice: 28;
	}

	.gold {
		--frame-width: calc(var(--spacing-4) + var(--border-width-base));
		border-image-source: url('/exhibits/frames/gold.png');
		border-image-slice: 36;
	}

	.platinum {
		--frame-width: calc(var(--spacing-4) + var(--spacing-1));
		border-image-source: url('/exhibits/frames/platinum.png');
		border-image-slice: 40;
	}

	.platinum::before {
		position: absolute;
		inset: calc(-1 * (var(--frame-width) * var(--frame-scale) + var(--spacing-8)));
		z-index: -1;
		background: radial-gradient(
			closest-side,
			color-mix(in srgb, var(--color-case-silver) 45%, transparent) 55%,
			transparent
		);
		content: '';
		pointer-events: none;
	}

	@media (min-width: 768px) {
		.frame {
			--frame-scale: 1;
		}

		.corner {
			top: var(--spacing-2);
			right: var(--spacing-2);
			left: auto;
		}
	}

	.picture {
		position: relative;
		min-block-size: 0;
		overflow: hidden;
		background: var(--color-stage-bg);
	}

	.engraving {
		display: block;
		inline-size: 100%;
		block-size: 100%;
		object-fit: cover;
	}

	.none .engraving {
		filter: blur(var(--spacing-3));
		transform: scale(1.15);
	}

	.light {
		position: absolute;
		inset: 0;
		mix-blend-mode: screen;
		pointer-events: none;
	}

	.bronze .light {
		background: radial-gradient(
			ellipse 55% 45% at 50% 0%,
			color-mix(in srgb, var(--color-case-gold) 18%, transparent),
			transparent 70%
		);
	}

	.silver .light {
		background: radial-gradient(
			ellipse 60% 50% at 50% 0%,
			color-mix(in srgb, var(--color-case-silver) 22%, transparent),
			transparent 72%
		);
	}

	.gold .light {
		background:
			radial-gradient(
				ellipse 65% 55% at 50% 0%,
				color-mix(in srgb, var(--color-case-gold) 35%, transparent),
				transparent 75%
			),
			radial-gradient(
				ellipse 50% 40% at 100% 15%,
				color-mix(in srgb, var(--color-case-gold) 15%, transparent),
				transparent 70%
			);
	}

	.platinum .light {
		background:
			radial-gradient(
				ellipse 75% 60% at 50% 0%,
				color-mix(in srgb, var(--color-case-silver) 40%, transparent),
				transparent 78%
			),
			radial-gradient(
				ellipse 55% 45% at 0% 10%,
				color-mix(in srgb, var(--color-case-silver) 15%, transparent),
				transparent 70%
			),
			radial-gradient(
				ellipse 55% 45% at 100% 10%,
				color-mix(in srgb, var(--color-case-silver) 15%, transparent),
				transparent 70%
			);
	}

	.corner {
		position: absolute;
		top: var(--spacing-1);
		left: var(--spacing-1);
	}
</style>
