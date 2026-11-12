<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Alert } from '@study-atelier/ui';

	type Props = {
		error?: string;
		errorTitle: string;
		children: Snippet;
	};

	let { error, errorTitle, children }: Props = $props();
</script>

<div class="card">
	{#if error}
		<Alert title={errorTitle} tone="danger">
			{error}
		</Alert>
	{/if}
	{@render children()}
</div>

<style>
	.card {
		display: grid;
		gap: var(--spacing-6);
		padding: var(--spacing-4) 0 0;
	}

	.card > :global([role='alert']) {
		max-width: var(--size-content-default);
	}

	@media (min-width: 768px) {
		.card {
			padding: var(--spacing-8);
			border: var(--border-width-hairline) solid var(--color-line);
			border-top: none;
		}
	}
</style>
