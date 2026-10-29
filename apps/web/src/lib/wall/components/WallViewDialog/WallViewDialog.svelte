<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { Button, Dialog, Select } from '@study-atelier/ui';
	import FilterPanel from '#lib/wall/components/FilterPanel/FilterPanel.svelte';
	import GroupingChoice from '#lib/wall/components/GroupingChoice/GroupingChoice.svelte';
	import { WALL_ORDERS, type WallView } from '#lib/wall/wall-view/wall-view.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		view: WallView;
	};

	let { view }: Props = $props();
</script>

<Dialog title={m.atelier.filters.viewTitle} bind:open={view.viewOpen}>
	<div class="view">
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
