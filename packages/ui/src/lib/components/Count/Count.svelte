<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLSpanElement> & {
		value: number;
		outlined?: boolean;
	};

	let { value, outlined = false, ...rest }: Props = $props();
</script>

<span class="count" class:outlined {...rest}>{value}</span>

<style>
	.count {
		min-width: 16px;
		padding: 0 var(--spacing-1);
		background: var(--color-fg);
		color: var(--color-bg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xs);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.outlined {
		outline: var(--border-width-hairline) solid var(--color-fg-muted);
		outline-offset: calc(-1 * var(--border-width-hairline));
		background: transparent;
		color: var(--color-fg-muted);
	}
</style>
