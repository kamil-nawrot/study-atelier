<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		lead?: string;
		aside?: Snippet;
		actions?: Snippet;
	};

	let { title, lead, aside, actions }: Props = $props();
</script>

<header class="page-header" class:with-actions={actions}>
	<div class="title">
		<h1>{title}</h1>
		{@render aside?.()}
	</div>
	{#if lead}
		<p class="lead">{lead}</p>
	{/if}
	{#if actions}
		<div class="actions">
			{@render actions()}
		</div>
	{/if}
</header>

<style>
	.page-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-2);
		padding-bottom: var(--spacing-8);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.with-actions {
		grid-template-columns: minmax(0, 1fr) auto;
		column-gap: var(--spacing-4);
	}

	.title {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		grid-column: 2;
		grid-row: 1 / span 2;
		align-self: center;
		gap: var(--spacing-2);
	}
</style>
