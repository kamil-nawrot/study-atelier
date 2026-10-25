<script lang="ts">
	import ImagesIcon from '@lucide/svelte/icons/images';
	import Plus from '@lucide/svelte/icons/plus';
	import { onMount } from 'svelte';
	import { Alert, Button, EmptyState, Icon, Section, TextButton, Toast } from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import FilterTags from '#lib/wall/components/FilterTags/FilterTags.svelte';
	import PeriodRail from '#lib/wall/components/PeriodRail/PeriodRail.svelte';
	import WallSections from '#lib/wall/components/WallSections/WallSections.svelte';
	import { onlyFavourites } from '#lib/wall/filter/filter.ts';
	import { removeTag } from '#lib/wall/filter-tags/filter-tags.ts';
	import { favouriteToast } from '#lib/wall/favourite/favourite.ts';
	import type { WallView } from '#lib/wall/wall-view/wall-view.svelte.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		view: WallView;
		error?: string;
		query: string;
		rendered: number;
	};

	let { view, error, query = $bindable(), rendered = $bindable() }: Props = $props();

	let wall = $state<HTMLElement>();

	const addPath = resolve('/(app)/atelier/new');
	const atelierPath = resolve('/(app)/atelier');
	const HIGHLIGHT_MS = 2000;

	let highlight = $state(page.state.highlight);
	let toast: Toast;

	onMount(() => {
		const trashed = page.state.trashed;
		if (trashed === undefined) return;
		toast.show(m.trash.moved(formatRecordNumber(trashed)));
		void goto(atelierPath, { state: {}, shallow: true, replace: true });
	});

	$effect(() => {
		if (highlight === undefined) return;
		const timer = setTimeout(() => {
			highlight = undefined;
			void goto(atelierPath, { state: {}, shallow: true, replace: true });
		}, HIGHLIGHT_MS);
		return () => clearTimeout(timer);
	});

	async function toggleFavourite(artwork: WallArtwork): Promise<void> {
		const next = await view.toggleFavourite(artwork);
		if (next !== undefined) toast.show(favouriteToast(next));
	}

	let searching = $derived(query.trim() !== '');

	$effect(() => {
		if (!wall || !view.showPeriods) return;
		return view.tracker.track(wall, view.barHeight);
	});
</script>

{#snippet emptyState(title: string, lead: string, action: string, onclick: () => void)}
	<div class="state">
		<Section>
			<h2>{title}</h2>
			<p class="lead">{lead}</p>
			<div>
				<Button {onclick}>{action}</Button>
			</div>
		</Section>
	</div>
{/snippet}

{#snippet tags()}
	<FilterTags
		onclear={() => view.clearFilter()}
		onremove={(tag) => (view.filter = removeTag(view.filter, tag))}
		tags={view.tags}
	/>
{/snippet}

<header>
	<h1>{m.atelier.title}</h1>
	{#if view.total > 0}
		<div class="summary">
			{#if view.grouped && view.sections.length > 0}
				<TextButton onclick={() => view.toggleAll()}>
					{view.collapsed.size > 0 ? m.atelier.grouping.expandAll : m.atelier.grouping.collapseAll}
				</TextButton>
			{/if}
			<span class="caption">
				{searching || view.filtering || view.shown.length < view.total
					? m.atelier.filteredCount(view.shown.length, view.total)
					: m.atelier.count(view.total)}
			</span>
		</div>
	{/if}
</header>

{#if error}
	<Alert title={m.atelier.loadErrorTitle} tone="danger">
		{error}
	</Alert>
{:else if view.total === 0}
	<EmptyState icon={ImagesIcon} text={m.atelier.empty} title={m.atelier.emptyTitle}>
		<Button href={addPath}>
			<Icon icon={Plus} />
			{m.atelier.addFirst}
		</Button>
	</EmptyState>
{:else if view.shown.length === 0 && view.filtering}
	{@render tags()}
	{@render emptyState(
		m.atelier.filters.noResultsTitle,
		onlyFavourites(view.filter) ? m.atelier.filters.noFavourites : m.atelier.filters.noResults,
		m.atelier.filters.clear,
		() => view.clearFilter()
	)}
{:else if view.shown.length === 0}
	{@render emptyState(
		m.atelier.noResultsTitle,
		m.atelier.noResults(query.trim()),
		m.atelier.clearSearch,
		() => (query = '')
	)}
{:else}
	{@render tags()}
	{#if view.favouriteError}
		<Alert tone="danger">
			{view.favouriteError}
		</Alert>
	{/if}
	{#if view.imagesUnavailable}
		<Alert title={m.atelier.imagesUnavailableTitle} tone="warning">
			{m.atelier.imagesUnavailable}
			<Button onclick={() => invalidateAll()}>
				{m.atelier.retryImages}
			</Button>
		</Alert>
	{/if}
	{#if view.grouped}
		<WallSections
			collapsed={view.collapsed}
			{highlight}
			inset={view.inset}
			onfavourite={toggleFavourite}
			onimagefailed={(artwork) => view.images.failed(artwork)}
			onnearscreen={(artwork) => view.images.request(artwork)}
			ontoggle={(key, open) => view.toggleSection(key, open)}
			sections={view.sections}
			bind:element={wall}
			bind:rendered
		/>
	{:else}
		<ArtworkWall
			artworks={view.shown}
			{highlight}
			inset={view.inset}
			onfavourite={toggleFavourite}
			onimagefailed={(artwork) => view.images.failed(artwork)}
			onnearscreen={(artwork) => view.images.request(artwork)}
			periodIndexes={view.periodIndexes}
			bind:element={wall}
			bind:rendered
		/>
	{/if}
	{#if view.showPeriods && view.railFits}
		<PeriodRail
			current={view.tracker.current}
			groups={view.groups}
			label={view.railLabel}
			width={view.tracker.margin}
		/>
	{/if}
{/if}

<Toast bind:this={toast} />

<style>
	.summary {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-4);
	}

	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-4);
	}

	.caption {
		font-variant-numeric: tabular-nums;
	}

	.state {
		max-width: var(--size-content-default);
	}
</style>
