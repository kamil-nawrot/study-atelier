<script lang="ts">
	import type { Metal } from '#lib/career/types/metal.ts';

	type Props = {
		numeral: string;
		metal: Metal;
	};

	let { numeral, metal }: Props = $props();
</script>

<span class="numeral {metal}" aria-hidden="true">{numeral}</span>

<style>
	.numeral {
		position: absolute;
		bottom: var(--spacing-2);
		left: 50%;
		padding: var(--spacing-1) var(--spacing-4);
		background: radial-gradient(
			closest-side,
			color-mix(in srgb, var(--color-stage-bg) 80%, transparent),
			transparent
		);
		color: var(--color-case-gold);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.bronze {
		color: var(--color-case-bronze);
	}

	.silver,
	.platinum {
		color: var(--color-case-silver);
	}
</style>
