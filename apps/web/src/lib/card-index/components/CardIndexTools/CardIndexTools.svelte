<script lang="ts">
	import type { Snippet } from 'svelte';
	import ListTools from '#lib/shared/lists/ListTools/ListTools.svelte';
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

<ListTools
	{actions}
	{options}
	{searchLabel}
	sortLabel={m.cardIndex.sortLabel}
	bind:query
	bind:sort={() => sort, (value) => (sort = value as CardIndexSort)}
/>
