<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		pressed?: boolean;
		count?: number;
		disabled?: boolean;
		onclick?: () => void;
	};

	let { children, pressed = $bindable(false), count, disabled = false, onclick }: Props = $props();

	function toggle(): void {
		pressed = !pressed;
		onclick?.();
	}
</script>

<button
	class="toggle"
	class:pressed
	aria-pressed={pressed}
	{disabled}
	onclick={toggle}
	type="button"
>
	<span class="label">{@render children()}</span>
	{#if count !== undefined}
		<span class="count">{count}</span>
	{/if}
</button>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		max-width: 100%;
		padding: var(--spacing-1) var(--spacing-2);
		border: none;
		border-radius: var(--border-radius-none);
		background: var(--color-tag);
		color: var(--color-fg);
		font: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-xs);
		cursor: pointer;
	}

	.toggle:hover:not(:disabled, .pressed) {
		background: var(--color-surface);
	}

	.toggle.pressed {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.toggle:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.toggle:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.count {
		color: var(--color-fg-muted);
		font-variant-numeric: tabular-nums;
	}

	.pressed .count {
		color: var(--color-on-fg);
	}
</style>
