<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		children: Snippet;
	};

	let { children, ...rest }: Props = $props();
</script>

<button class="text-button" type="button" {...rest}>
	{@render children()}
</button>

<style>
	.text-button {
		padding: var(--spacing-1) var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		text-decoration: underline;
		text-underline-offset: var(--spacing-1);
		white-space: nowrap;
		cursor: pointer;
	}

	.text-button:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}
</style>
