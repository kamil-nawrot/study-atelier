<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		size?: 'list' | 'view';
		children: Snippet;
	};

	let { size = 'list', children }: Props = $props();
</script>

<div class="frame {size}">
	{@render children()}
</div>

<style>
	.frame {
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
	}

	.frame :global(img) {
		display: block;
		max-width: 100%;
		height: auto;
	}

	.list {
		border-bottom-width: var(--border-width-heavy);
		padding: var(--spacing-2) var(--spacing-2) var(--spacing-3);
	}

	.view {
		border-bottom-width: var(--border-width-mat);
		padding: var(--spacing-4) var(--spacing-4) var(--spacing-6);
	}
</style>
