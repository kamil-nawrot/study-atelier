<script lang="ts">
	import type { Snippet } from 'svelte';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { SearchField, Select } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { CardIndexSort } from '#lib/card-index/card-index-sort/card-index-sort.ts';

	type Props = {
		searchLabel: string;
		query?: string;
		sorts?: CardIndexSort[];
		sort?: CardIndexSort;
		actions?: Snippet;
	};

	let {
		searchLabel,
		query = $bindable(''),
		sorts = [],
		sort = $bindable('name'),
		actions
	}: Props = $props();

	let options = $derived(sorts.map((value) => ({ value, label: m.cardIndex.sorts[value] })));
</script>

<div class="tools">
	<SearchField compact label={searchLabel} placeholder={searchLabel} bind:value={query} />
	{#if options.length > 1}
		<Select
			compact
			hideLabel
			icon={ArrowUpDown}
			iconOnPhone
			label={m.cardIndex.sortLabel}
			{options}
			bind:value={() => sort, (value) => (sort = value as CardIndexSort)}
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
		gap: var(--spacing-4);
	}

	.actions {
		display: flex;
		gap: var(--spacing-2);
	}

	@media (max-width: 767.98px) {
		.tools {
			grid-auto-flow: column;
			grid-template-columns: minmax(0, 1fr);
			grid-auto-columns: auto;
			gap: var(--spacing-2);
		}
	}

	@media (min-width: 768px) {
		.tools {
			grid-template-columns: minmax(0, 1fr) auto auto;
			align-items: start;
		}

		.actions {
			display: flex;
			flex-wrap: wrap;
			justify-content: flex-end;
		}
	}
</style>
