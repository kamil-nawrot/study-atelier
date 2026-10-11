<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		variant?: 'primary' | 'secondary';
		fullWidth?: boolean;
		children: Snippet;
	};

	let {
		variant = 'secondary',
		fullWidth = false,
		type = 'button',
		children,
		...rest
	}: Props = $props();
</script>

<button class="button {variant}" class:full-width={fullWidth} {type} {...rest}>
	{@render children()}
</button>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2) var(--spacing-4);
		border: var(--border-width-base) solid var(--color-line);
		border-bottom-width: var(--border-width-button);
		border-radius: var(--border-radius-none);
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		cursor: pointer;
	}

	.secondary:hover:not(:disabled) {
		border-bottom-width: var(--border-width-heavy);
		padding-bottom: calc(var(--spacing-2) - var(--border-width-heavy) + var(--border-width-button));
	}

	.primary {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.primary:hover:not(:disabled) {
		border-color: var(--color-fg-muted);
		background: var(--color-fg-muted);
	}

	.button:disabled {
		border-color: var(--color-fg-muted);
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.primary:disabled {
		background: transparent;
	}

	.full-width {
		width: 100%;
	}
</style>
