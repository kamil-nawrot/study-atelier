<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLSpanElement> & {
		value: number;
	};

	let { value, ...rest }: Props = $props();
</script>

<span class="count" {...rest}>{value}</span>

<style>
	.count {
		min-width: 16px;
		padding: 0 var(--spacing-1);
		background: var(--color-fg);
		color: var(--color-bg);
		font-family: var(--font-family-ui), system-ui, sans-serif;
		font-size: var(--font-size-xs);
		font-style: normal;
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xs);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
</style>
