<script lang="ts">
	import type { Snippet } from 'svelte';
	import { uiMessages } from '../../messages/messages';

	type Props = {
		children: Snippet;
		onremove?: () => void;
		removeLabel?: string;
		removeDisabled?: boolean;
	};

	let {
		children,
		onremove,
		removeLabel = uiMessages().removeTag,
		removeDisabled = false
	}: Props = $props();
</script>

<span class="tag">
	<span class="label">{@render children()}</span>
	{#if onremove}
		<button
			class="remove"
			aria-label={removeLabel}
			disabled={removeDisabled}
			onclick={onremove}
			type="button">×</button
		>
	{/if}
</span>

<style>
	.tag {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-1) var(--spacing-2);
		border: none;
		border-radius: var(--border-radius-none);
		background: var(--color-tag);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-xs);
		max-width: 100%;
	}

	.remove {
		padding: 0;
		border: none;
		background: none;
		color: var(--color-fg-muted);
		font: inherit;
		line-height: 1;
		cursor: pointer;
	}

	.remove:hover:not(:disabled) {
		color: var(--color-fg);
	}

	.remove:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}
</style>
