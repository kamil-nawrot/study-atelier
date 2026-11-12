<script lang="ts">
	import type { Snippet } from 'svelte';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { SearchField, Select } from '@study-atelier/ui';

	type Option = { value: string; label: string };

	type Props = {
		searchLabel?: string;
		query?: string;
		sortLabel: string;
		options?: Option[];
		sort?: string;
		actions?: Snippet;
	};

	let {
		searchLabel,
		query = $bindable(''),
		sortLabel,
		options = [],
		sort = $bindable(''),
		actions
	}: Props = $props();
</script>

<div class="tools" class:searchable={searchLabel}>
	{#if searchLabel}
		<SearchField compact label={searchLabel} placeholder={searchLabel} bind:value={query} />
	{/if}
	{#if options.length > 1}
		<Select
			compact
			hideLabel
			icon={ArrowUpDown}
			iconOnPhone
			label={sortLabel}
			{options}
			bind:value={sort}
		/>
	{/if}
	{#if actions}
		<div class="actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.tools {
		display: grid;
		grid-auto-columns: auto;
		grid-auto-flow: column;
		justify-content: end;
		align-items: start;
		gap: var(--spacing-4);
	}

	.searchable {
		grid-template-columns: minmax(0, 1fr);
		justify-content: stretch;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-2);
	}

	@media (max-width: 767.98px) {
		.tools {
			gap: var(--spacing-2);
		}

		.actions {
			flex-wrap: nowrap;
		}
	}
</style>
