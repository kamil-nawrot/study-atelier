<script lang="ts">
	import { SearchField, Select } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { CardIndexSort } from '#lib/card-index/card-index-sort/card-index-sort.ts';

	type Props = {
		searchLabel: string;
		query?: string;
		sorts?: CardIndexSort[];
		sort?: CardIndexSort;
	};

	let {
		searchLabel,
		query = $bindable(''),
		sorts = [],
		sort = $bindable('name')
	}: Props = $props();

	let options = $derived(sorts.map((value) => ({ value, label: m.cardIndex.sorts[value] })));
</script>

<div class="tools">
	<SearchField label={searchLabel} placeholder={searchLabel} bind:value={query} />
	{#if options.length > 1}
		<Select
			hideLabel
			label={m.cardIndex.sortLabel}
			{options}
			bind:value={() => sort, (value) => (sort = value as CardIndexSort)}
		/>
	{/if}
</div>

<style>
	.tools {
		display: grid;
		gap: var(--spacing-4);
	}

	@media (min-width: 768px) {
		.tools {
			grid-template-columns: minmax(0, var(--size-content-default)) auto;
			justify-content: start;
		}
	}
</style>
