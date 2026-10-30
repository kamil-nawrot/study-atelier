<script lang="ts">
	import { Tag } from '@study-atelier/ui';
	import type { Metal } from '#lib/career/types/metal.ts';

	type Props = {
		numeral: string;
		metal: Metal;
		mark?: string;
	};

	let { numeral, metal, mark }: Props = $props();
</script>

<span class="band" aria-hidden="true">
	<span class="numeral {metal}">{numeral}</span>
	{#if mark}
		<span class="mark"><Tag>{mark}</Tag></span>
	{/if}
</span>

<style>
	.band {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-1) var(--spacing-2);
		background: color-mix(in srgb, var(--color-stage-bg) 60%, transparent);
		pointer-events: none;
	}

	.numeral {
		grid-column: 2;
		color: var(--color-case-gold);
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-lg);
		line-height: var(--line-height-lg);
	}

	.mark {
		display: flex;
		grid-column: 3;
	}

	.bronze {
		color: var(--color-case-bronze);
	}

	.silver,
	.platinum {
		color: var(--color-case-silver);
	}
</style>
