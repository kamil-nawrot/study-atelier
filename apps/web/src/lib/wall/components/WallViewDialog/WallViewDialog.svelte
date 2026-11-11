<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Columns2 from '@lucide/svelte/icons/columns-2';
	import Square from '@lucide/svelte/icons/square';
	import { Button, ChoiceTiles, Dialog, Select } from '@study-atelier/ui';
	import FilterPanel from '#lib/wall/components/FilterPanel/FilterPanel.svelte';
	import GroupingChoice from '#lib/wall/components/GroupingChoice/GroupingChoice.svelte';
	import { WALL_ORDERS, type WallView } from '#lib/wall/wall-view/wall-view.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { choosePhoneColumns, phoneColumns } from '#lib/wall/wall-columns/wall-columns.svelte.ts';

	type Props = {
		view: WallView;
	};

	let { view }: Props = $props();

	const layouts = [
		{ value: '1', label: m.atelier.filters.layoutOne, icon: Square },
		{ value: '2', label: m.atelier.filters.layoutTwo, icon: Columns2 }
	];
</script>

<Dialog title={m.atelier.filters.viewTitle} bind:open={view.viewOpen}>
	<div class="view">
		<ChoiceTiles
			columns={2}
			label={m.atelier.filters.layout}
			narrowColumns={2}
			onchange={(value) => value && choosePhoneColumns(value === '1' ? 1 : 2)}
			options={layouts}
			value={String(phoneColumns())}
		/>
		<Select
			disabled={view.total === 0}
			icon={ArrowUpDown}
			label={m.atelier.sort.label}
			options={WALL_ORDERS}
			bind:value={() => view.order, (value) => view.chooseOrder(value)}
		/>
		<GroupingChoice fill {view} />
		<FilterPanel artworks={view.artworks} ownFields={view.ownFields} bind:filter={view.filter} />
	</div>
	{#snippet footer()}
		<Button disabled={!view.filtering} onclick={() => view.clearFilter()}>
			{m.atelier.filters.clear}
		</Button>
		<Button onclick={() => (view.viewOpen = false)} variant="primary">
			{m.atelier.filters.showResults(view.shown.length)}
		</Button>
	{/snippet}
</Dialog>

<style>
	.view {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-8);
	}
</style>
