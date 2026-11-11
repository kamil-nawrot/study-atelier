<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		lead: string;
		aside?: Snippet;
		actions?: Snippet;
	};

	let { lead, aside, actions }: Props = $props();
</script>

<header class="page-header">
	<p class="lead">{lead}</p>
	{#if aside}
		<div class="aside">
			{@render aside()}
		</div>
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
		grid-auto-columns: auto;
		align-items: baseline;
		gap: var(--spacing-2) var(--spacing-4);
		padding-bottom: var(--spacing-8);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.lead {
		grid-area: 1 / 1;
	}

	.aside {
		grid-area: 1 / 2;
		font-variant-numeric: tabular-nums;
	}

	.aside:empty {
		display: none;
	}

	.actions {
		display: flex;
		grid-area: 1 / 2;
		align-self: start;
		gap: var(--spacing-2);
	}

	@media (max-width: 767.98px) {
		.page-header {
			display: none;
		}
	}
</style>
