<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		tone?: 'danger' | 'success' | 'warning';
		title?: string;
		children: Snippet;
	};

	let { tone = 'danger', title, children }: Props = $props();
</script>

<div class="message {tone}" role={tone === 'danger' ? 'alert' : 'status'}>
	{#if title}
		<strong>{title}</strong>
	{/if}
	<span>{@render children()}</span>
</div>

<style>
	.message {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-2) 0 var(--spacing-2) var(--spacing-4);
		border-left: var(--border-width-heavy) solid var(--tone);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	strong {
		color: var(--tone);
		font-weight: var(--font-weight-bold);
	}

	.danger {
		--tone: var(--color-danger);
	}

	.success {
		--tone: var(--color-success);
	}

	.warning {
		--tone: var(--color-warning);
	}
</style>
