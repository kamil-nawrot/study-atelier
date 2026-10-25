<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/state';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import FilterPanel from '#lib/wall/components/FilterPanel/FilterPanel.svelte';
	import FilterSidePanel from '#lib/wall/components/FilterSidePanel/FilterSidePanel.svelte';
	import PeriodStrip from '#lib/wall/components/PeriodStrip/PeriodStrip.svelte';
	import WallPage from '#lib/wall/components/WallPage/WallPage.svelte';
	import WallTools from '#lib/wall/components/WallTools/WallTools.svelte';
	import WallViewDialog from '#lib/wall/components/WallViewDialog/WallViewDialog.svelte';
	import { WALL_PART } from '#lib/wall/masonry/masonry.ts';
	import { WallView } from '#lib/wall/wall-view/wall-view.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let rendered = $state(WALL_PART);
	const collapsed = new SvelteSet<string>();

	const view = new WallView(
		() => ({ artworks: data.artworks, ownFields: data.ownFields, query, collapsed }),
		page.url.searchParams
	);
	view.follow();
	view.keepAddress();

	export const snapshot: Snapshot<{ query: string; rendered: number; collapsed: string[] }> = {
		capture: () => ({ query, rendered, collapsed: [...collapsed] }),
		restore: (value) => {
			query = value.query;
			rendered = value.rendered;
			collapsed.clear();
			for (const key of value.collapsed ?? []) collapsed.add(key);
		}
	};
</script>

<AtelierLayout
	email={data.session.user.email ?? ''}
	title={m.atelier.title}
	bind:barHeight={view.barHeight}
>
	{#snippet bar()}
		<WallTools {view} bind:query />
	{/snippet}

	{#snippet panel()}
		{#if view.wide.current}
			<FilterSidePanel
				filtering={view.filtering}
				onclear={() => view.clearFilter()}
				summary={m.atelier.filteredCount(view.shown.length, view.total)}
				bind:open={view.panelOpen}
			>
				<FilterPanel
					artworks={view.artworks}
					ownFields={view.ownFields}
					bind:filter={view.filter}
				/>
			</FilterSidePanel>
		{/if}
	{/snippet}

	{#snippet strip()}
		{#if view.showPeriods && !view.railFits}
			<PeriodStrip
				current={view.tracker.current}
				groups={view.groups}
				label={view.railLabel}
				bind:height={view.stripHeight}
			/>
		{/if}
	{/snippet}

	<WallPage error={data.error} {view} bind:query bind:rendered />
</AtelierLayout>

{#if !view.wide.current}
	<WallViewDialog {view} />
{/if}
