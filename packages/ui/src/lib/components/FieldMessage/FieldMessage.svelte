<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		id: string;
		hint?: string | Snippet;
		error?: string;
		live?: boolean;
	};

	let { id, hint, error, live = false }: Props = $props();
</script>

<span {id} class="message" class:error={!!error} aria-live={live ? 'polite' : undefined}>
	{#if error}
		{error}
	{:else if typeof hint === 'function'}
		{@render hint()}
	{:else}
		{hint ?? ''}
	{/if}
</span>

<style>
	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
	}
</style>
