<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Plus from '@lucide/svelte/icons/plus';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { Button, Icon, PopupButton, SearchField, Select, Tooltip } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import GroupingChoice from '#lib/wall/components/GroupingChoice/GroupingChoice.svelte';
	import {
		GROUPING_STEPS,
		WALL_ORDERS,
		type WallView
	} from '#lib/wall/wall-view/wall-view.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		view: WallView;
		query: string;
	};

	let { view, query = $bindable() }: Props = $props();

	const addPath = resolve('/(app)/atelier/new');
</script>

<div class="tools">
	<div class="search">
		<SearchField
			disabled={view.total === 0}
			label={m.atelier.search}
			placeholder={m.atelier.search}
			bind:value={query}
		/>
	</div>
	{#if view.wide.current}
		<PopupButton disabled={view.total === 0} label={view.groupingLabel} tooltip>
			{#snippet trigger()}
				<span class="levels" aria-hidden="true">
					{#each GROUPING_STEPS as step, index (step.value)}
						<span class:on={index < view.depth}></span>
					{/each}
				</span>
			{/snippet}
			<GroupingChoice {view} />
		</PopupButton>
		<div class="sort">
			<Select
				compact
				disabled={view.total === 0}
				icon={ArrowUpDown}
				label={m.atelier.sort.label}
				options={WALL_ORDERS}
				bind:value={() => view.order, (value) => view.chooseOrder(value)}
			/>
		</div>
	{/if}
	<Tooltip align="end" placement="bottom" text={view.filtersLabel}>
		{#snippet children(id)}
			<Button
				aria-describedby={id}
				aria-expanded={view.wide.current ? view.panelOpen : undefined}
				aria-haspopup={view.wide.current ? undefined : 'dialog'}
				aria-label={view.wide.current ? view.filtersLabel : m.atelier.filters.viewButton}
				disabled={view.total === 0}
				onclick={() =>
					view.wide.current ? (view.panelOpen = !view.panelOpen) : (view.viewOpen = true)}
				variant={view.filtering ? 'primary' : 'secondary'}
			>
				<Icon icon={SlidersHorizontal} />
			</Button>
		{/snippet}
	</Tooltip>
	<Tooltip align="end" placement="bottom" text={m.atelier.add}>
		{#snippet children(id)}
			<Button aria-describedby={id} aria-label={m.atelier.add} href={addPath} variant="primary">
				<Icon icon={Plus} />
			</Button>
		{/snippet}
	</Tooltip>
</div>

<style>
	.tools {
		display: flex;
		flex: 1;
		align-items: stretch;
		gap: var(--spacing-2);
		min-width: 0;
		max-width: var(--size-content-wide);
		margin-inline-start: max(0px, calc((100% - var(--size-content-wide)) / 2));
	}

	.search {
		flex: 1;
		min-width: 0;
		max-width: var(--size-content-default);
	}

	.sort {
		flex: none;
	}

	.levels {
		display: grid;
		gap: var(--spacing-1);
		width: 24px;
	}

	.levels span {
		height: var(--border-width-button);
		background: var(--color-fg-muted);
		opacity: 0.35;
	}

	.levels span:nth-child(2) {
		margin-inline-start: var(--spacing-1);
	}

	.levels span:nth-child(3) {
		margin-inline-start: var(--spacing-2);
	}

	.levels span.on {
		background: var(--color-fg);
		opacity: 1;
	}
</style>
