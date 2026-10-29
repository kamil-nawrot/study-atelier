<script lang="ts">
	import type { Snippet } from 'svelte';
	import { asset } from '$app/paths';
	import { artOf, imageOf } from '#lib/career/exhibit-art/exhibit-art.ts';
	import type { Metal } from '#lib/career/types/metal.ts';

	type Props = {
		code: string;
		metal: Metal;
		children?: Snippet;
	};

	let { code, metal, children }: Props = $props();
</script>

<div class="frame {metal}">
	<div class="picture">
		{#if artOf(code)}
			<img class="engraving" alt="" src={asset(imageOf(code, metal))} />
		{/if}
		<span class="light"></span>
	</div>
	{#if children}
		<div class="corner">{@render children()}</div>
	{/if}
</div>

<style>
	.frame {
		position: relative;
		display: grid;
		aspect-ratio: 10 / 13;
		padding: var(--spacing-1);
		border: var(--border-width-hairline) solid var(--color-case-unlit);
		background: var(--color-stage-bg);
	}

	.bronze {
		padding: var(--spacing-3);
		border: none;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-case-bronze) 55%, var(--color-stage-bg)),
			color-mix(in srgb, var(--color-case-bronze) 25%, var(--color-stage-bg)) 60%,
			color-mix(in srgb, var(--color-case-bronze) 45%, var(--color-stage-bg))
		);
	}

	.silver {
		padding: var(--spacing-3);
		border: var(--border-width-base) solid var(--color-case-iron);
		background: linear-gradient(
			135deg,
			var(--color-case-iron),
			color-mix(in srgb, var(--color-case-iron) 50%, var(--color-stage-bg)) 50%,
			var(--color-case-iron)
		);
	}

	.gold {
		padding: var(--spacing-4);
		border: var(--border-width-heavy) double var(--color-case-gold);
		background: linear-gradient(
			135deg,
			var(--color-case-gold),
			color-mix(in srgb, var(--color-case-gold) 45%, var(--color-stage-bg)) 45%,
			var(--color-case-gold) 70%,
			color-mix(in srgb, var(--color-case-gold) 55%, var(--color-stage-bg))
		);
	}

	.platinum {
		padding: var(--spacing-4);
		border: var(--border-width-heavy) double var(--color-case-silver);
		background: linear-gradient(
			135deg,
			var(--color-case-silver),
			var(--color-case-iron) 40%,
			var(--color-case-silver) 65%,
			var(--color-case-iron)
		);
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
		top: var(--spacing-2);
		right: var(--spacing-2);
	}
</style>
