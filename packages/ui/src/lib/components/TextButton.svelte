<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		children: Snippet;
		inline?: boolean;
		danger?: boolean;
	};

	let { children, inline = false, danger = false, ...rest }: Props = $props();
</script>

<button class="text-button" class:danger class:inline type="button" {...rest}>
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

	.text-button.inline {
		padding-inline: 0;
	}

	.text-button.danger {
		color: var(--color-danger);
	}

	.text-button:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}
</style>
