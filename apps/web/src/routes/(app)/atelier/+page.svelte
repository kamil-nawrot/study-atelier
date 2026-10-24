<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Plus from '@lucide/svelte/icons/plus';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { onMount, untrack } from 'svelte';
	import { MediaQuery, SvelteSet } from 'svelte/reactivity';
	import {
		Alert,
		Button,
		Dialog,
		Icon,
		SearchField,
		Section,
		Select,
		type SelectOption,
		PopupButton,
		StepSelect,
		type StepOption,
		TextButton,
		Toast,
		Tooltip
	} from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import AtelierLayout from '#lib/shell/AtelierLayout/AtelierLayout.svelte';
	import FilterPanel from '#lib/wall/components/FilterPanel/FilterPanel.svelte';
	import FilterSidePanel from '#lib/wall/components/FilterSidePanel/FilterSidePanel.svelte';
	import FilterTags from '#lib/wall/components/FilterTags/FilterTags.svelte';
	import WallSections from '#lib/wall/components/WallSections/WallSections.svelte';
	import {
		applyFilter,
		emptyFilter,
		filterFromParams,
		filterTags,
		filterToParams,
		isEmptyFilter,
		onlyFavourites,
		pruneFilter,
		removeTag
	} from '#lib/wall/filter/filter.ts';
	import { favouriteToast, setFavourite } from '#lib/artworks/favourite/favourite.ts';
	import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
	import { WALL_PART } from '#lib/wall/masonry/masonry.ts';
	import PeriodRail from '#lib/wall/components/PeriodRail/PeriodRail.svelte';
	import PeriodStrip from '#lib/wall/components/PeriodStrip/PeriodStrip.svelte';
	import {
		groupingFromParams,
		groupWall,
		orderWall,
		railGroups,
		sectionKeys,
		sectionSequence,
		WALL_GROUPINGS,
		wallParams
	} from '#lib/wall/grouping/grouping.ts';
	import { groupByAuthor } from '#lib/wall/periods/periods.ts';
	import {
		MIN_RAIL_MARGIN,
		PeriodTracker
	} from '#lib/wall/period-tracker/period-tracker.svelte.ts';
	import { filterByTitleOrAuthor } from '#lib/wall/search/search.ts';
	import type { WallOrder } from '#lib/wall/types/wall-order.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import {
		isWallOrder,
		rememberedWallOrder,
		rememberWallOrder
	} from '#lib/wall/wall-order/wall-order.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import { rememberWallSequence } from '#lib/wall/wall-sequence/wall-sequence.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let order = $state<WallOrder>(rememberedWallOrder());
	let filter = $state(filterFromParams(page.url.searchParams));
	let grouping = $state(groupingFromParams(page.url.searchParams));
	const collapsed = new SvelteSet<string>();
	let panelOpen = $state(false);
	let viewOpen = $state(false);
	let barHeight = $state(0);
	let wall = $state<HTMLElement>();
	let rendered = $state(WALL_PART);

	const tracker = new PeriodTracker();
	const wide = new MediaQuery('min-width: 768px');

	const orders: SelectOption[] = [
		{ value: 'recent', label: m.atelier.sort.recent },
		{ value: 'year', label: m.atelier.sort.year },
		{ value: 'author', label: m.atelier.sort.author }
	];

	function chooseOrder(value: string): void {
		if (!isWallOrder(value)) return;
		order = value;
		rememberWallOrder(value);
		window.scrollTo({ top: 0 });
	}

	const groupingSteps: StepOption[] = WALL_GROUPINGS.flatMap((value) =>
		value === 'none' ? [] : [{ value, label: m.atelier.grouping.steps[value] }]
	);

	function chooseGrouping(value: string): void {
		const next = WALL_GROUPINGS.find((known) => known === (value || 'none'));
		if (!next || next === grouping) return;
		grouping = next;
		collapsed.clear();
		window.scrollTo({ top: 0 });
	}

	function toggleSection(key: string, open: boolean): void {
		if (open) collapsed.delete(key);
		else collapsed.add(key);
	}

	function toggleAll(): void {
		if (collapsed.size > 0) collapsed.clear();
		else for (const key of sectionKeys(sections)) collapsed.add(key);
	}

	export const snapshot: Snapshot<{ query: string; rendered: number; collapsed: string[] }> = {
		capture: () => ({ query, rendered, collapsed: [...collapsed] }),
		restore: (value) => {
			query = value.query;
			rendered = value.rendered;
			collapsed.clear();
			for (const key of value.collapsed ?? []) collapsed.add(key);
		}
	};

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

	const images = new WallImages();

	async function toggleFavourite(artwork: WallArtwork): Promise<void> {
		const next = !artwork.favourite;
		favouriteError = undefined;
		favourites[artwork.id] = next;
		const { error } = await setFavourite(artwork.id, next);
		if (error) {
			favourites[artwork.id] = !next;
			favouriteError = error;
			return;
		}
		toast.show(favouriteToast(next));
	}

	$effect.pre(() => {
		const pruned = pruneFilter(
			untrack(() => filter),
			data.artworks,
			data.ownFields
		);
		if (filterToParams(pruned).toString() !== untrack(() => filterToParams(filter).toString()))
			filter = pruned;
	});

	$effect.pre(() => {
		void data.artworks;
		images.reset();
	});

	let favourites = $state<Record<string, boolean>>({});
	let favouriteError = $state<string>();

	$effect.pre(() => {
		void data.artworks;
		favourites = {};
	});

	let artworks = $derived(
		images
			.apply(data.artworks)
			.map((artwork) =>
				artwork.id in favourites ? { ...artwork, favourite: favourites[artwork.id] } : artwork
			)
	);
	let imagesUnavailable = $derived(artworks.some((artwork) => artwork.imageUnavailable));
	let filtered = $derived(applyFilter(artworks, filter));
	let tags = $derived(filterTags(filter, data.ownFields));
	let filtering = $derived(!isEmptyFilter(filter));
	let matching = $derived(filterByTitleOrAuthor(filtered, query));
	let grouped = $derived(grouping !== 'none');
	let depth = $derived(groupingSteps.findIndex((step) => step.value === grouping) + 1);
	let groupingLabel = $derived(
		m.atelier.grouping.button(
			depth === 0
				? m.atelier.grouping.off
				: groupingSteps
						.slice(0, depth)
						.map((step) => step.label.toLowerCase())
						.join(' › ')
		)
	);
	let filtersLabel = $derived(
		filtering ? m.atelier.filters.buttonWithCount(tags.length) : m.atelier.filters.button
	);
	let ordered = $derived(orderWall(matching, order));
	let sections = $derived(groupWall(ordered, grouping));
	let groups = $derived(
		grouped ? railGroups(sections) : order === 'author' ? groupByAuthor(matching) : []
	);
	let shown = $derived(grouped ? sectionSequence(sections) : ordered);
	let railLabel = $derived(grouped ? m.atelier.periods.label : m.atelier.authors.label);
	let periodIndexes = $derived(
		grouped
			? undefined
			: new Map(
					groups.flatMap((group, index) => group.artworks.map((artwork) => [artwork.id, index]))
				)
	);
	let written = $derived(wallParams(filterToParams(filter), grouping).toString());
	let total = $derived(artworks.length);
	let searching = $derived(query.trim() !== '');
	let showPeriods = $derived(groups.length > 1);
	let panelShown = $derived(wide.current && panelOpen);

	let railFits = $derived(tracker.margin >= MIN_RAIL_MARGIN && !panelShown);
	let stripHeight = $state(0);

	const writtenQueries = new SvelteSet<string>();

	$effect(() => {
		if (written === untrack(() => page.url.searchParams.toString())) return;
		untrack(() => writtenQueries.add(written));
		const target =
			`${resolve('/(app)/atelier')}${written ? `?${written}` : ''}` as ResolvedPathname;
		void goto(target, { replace: true, reset: false });
	});

	$effect(() => {
		const current = page.url.searchParams.toString();
		if (untrack(() => writtenQueries.delete(current))) return;
		if (current === untrack(() => written)) return;
		grouping = groupingFromParams(page.url.searchParams);
		filter = pruneFilter(
			filterFromParams(page.url.searchParams),
			untrack(() => artworks),
			data.ownFields
		);
	});

	$effect(() => {
		rememberWallSequence({
			query: written,
			numbers: shown.map((artwork) => artwork.number)
		});
	});

	$effect(() => {
		if (!wall || !showPeriods) return;
		return tracker.track(wall, barHeight);
	});
</script>

{#snippet levels()}
	<span class="levels" aria-hidden="true">
		{#each groupingSteps as step, index (step.value)}
			<span class:on={index < depth}></span>
		{/each}
	</span>
{/snippet}

{#snippet groupingChoice()}
	<div class="grouping-panel">
		<StepSelect
			label={m.atelier.grouping.label}
			size="lg"
			steps={groupingSteps}
			bind:value={() => (grouping === 'none' ? '' : grouping), chooseGrouping}
		/>
		<p class="caption">{m.atelier.grouping.hint}</p>
	</div>
{/snippet}

<AtelierLayout email={data.session.user.email ?? ''} title={m.atelier.title} bind:barHeight>
	{#snippet bar()}
		<div class="tools">
			<div class="search">
				<SearchField
					disabled={total === 0}
					label={m.atelier.search}
					placeholder={m.atelier.search}
					bind:value={query}
				/>
			</div>
			{#if wide.current}
				<PopupButton disabled={total === 0} label={groupingLabel} tooltip>
					{#snippet trigger()}
						{@render levels()}
					{/snippet}
					{@render groupingChoice()}
				</PopupButton>
				<div class="sort">
					<Select
						compact
						disabled={total === 0}
						icon={ArrowUpDown}
						label={m.atelier.sort.label}
						options={orders}
						bind:value={() => order, chooseOrder}
					/>
				</div>
			{/if}
			<Tooltip align="end" placement="bottom" text={filtersLabel}>
				{#snippet children(id)}
					<Button
						aria-describedby={id}
						aria-expanded={wide.current ? panelOpen : undefined}
						aria-haspopup={wide.current ? undefined : 'dialog'}
						aria-label={wide.current ? filtersLabel : m.atelier.filters.viewButton}
						disabled={total === 0}
						onclick={() => (wide.current ? (panelOpen = !panelOpen) : (viewOpen = true))}
						variant={filtering ? 'primary' : 'secondary'}
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
	{/snippet}

	{#snippet panel()}
		{#if wide.current}
			<FilterSidePanel
				{filtering}
				onclear={() => (filter = emptyFilter())}
				summary={m.atelier.filteredCount(shown.length, total)}
				bind:open={panelOpen}
			>
				<FilterPanel {artworks} ownFields={data.ownFields} bind:filter />
			</FilterSidePanel>
		{/if}
	{/snippet}

	{#snippet strip()}
		{#if showPeriods && !railFits}
			<PeriodStrip current={tracker.current} {groups} label={railLabel} bind:height={stripHeight} />
		{/if}
	{/snippet}

	<header>
		<h1>{m.atelier.title}</h1>
		{#if total > 0}
			<div class="summary">
				{#if grouped && sections.length > 0}
					<TextButton onclick={toggleAll}>
						{collapsed.size > 0 ? m.atelier.grouping.expandAll : m.atelier.grouping.collapseAll}
					</TextButton>
				{/if}
				<span class="caption">
					{searching || filtering || shown.length < total
						? m.atelier.filteredCount(shown.length, total)
						: m.atelier.count(total)}
				</span>
			</div>
		{/if}
	</header>

	{#if data.error}
		<Alert title={m.atelier.loadErrorTitle} tone="danger">
			{data.error}
		</Alert>
	{:else if total === 0}
		<div class="state">
			<Section>
				<h2>{m.atelier.emptyTitle}</h2>
				<p class="lead">{m.atelier.empty}</p>
				<div>
					<Button href={addPath}>
						<Icon icon={Plus} />
						{m.atelier.addFirst}
					</Button>
				</div>
			</Section>
		</div>
	{:else if shown.length === 0 && filtering}
		<FilterTags
			onclear={() => (filter = emptyFilter())}
			onremove={(tag) => (filter = removeTag(filter, tag))}
			{tags}
		/>
		<div class="state">
			<Section>
				<h2>{m.atelier.filters.noResultsTitle}</h2>
				<p class="lead">
					{onlyFavourites(filter) ? m.atelier.filters.noFavourites : m.atelier.filters.noResults}
				</p>
				<div>
					<Button onclick={() => (filter = emptyFilter())}>
						{m.atelier.filters.clear}
					</Button>
				</div>
			</Section>
		</div>
	{:else if shown.length === 0}
		<div class="state">
			<Section>
				<h2>{m.atelier.noResultsTitle}</h2>
				<p class="lead">{m.atelier.noResults(query.trim())}</p>
				<div>
					<Button onclick={() => (query = '')}>
						{m.atelier.clearSearch}
					</Button>
				</div>
			</Section>
		</div>
	{:else}
		<FilterTags
			onclear={() => (filter = emptyFilter())}
			onremove={(tag) => (filter = removeTag(filter, tag))}
			{tags}
		/>
		{#if favouriteError}
			<Alert tone="danger">
				{favouriteError}
			</Alert>
		{/if}
		{#if imagesUnavailable}
			<Alert title={m.atelier.imagesUnavailableTitle} tone="warning">
				{m.atelier.imagesUnavailable}
				<Button onclick={() => invalidateAll()}>
					{m.atelier.retryImages}
				</Button>
			</Alert>
		{/if}
		{#if grouped}
			<WallSections
				{collapsed}
				{highlight}
				inset={showPeriods && !railFits ? stripHeight : 0}
				onfavourite={toggleFavourite}
				onimagefailed={(artwork) => images.failed(artwork)}
				onnearscreen={(artwork) => images.request(artwork)}
				ontoggle={toggleSection}
				{sections}
				bind:element={wall}
				bind:rendered
			/>
		{:else}
			<ArtworkWall
				artworks={shown}
				{highlight}
				inset={showPeriods && !railFits ? stripHeight : 0}
				onfavourite={toggleFavourite}
				onimagefailed={(artwork) => images.failed(artwork)}
				onnearscreen={(artwork) => images.request(artwork)}
				{periodIndexes}
				bind:element={wall}
				bind:rendered
			/>
		{/if}
		{#if showPeriods && railFits}
			<PeriodRail current={tracker.current} {groups} label={railLabel} width={tracker.margin} />
		{/if}
	{/if}
</AtelierLayout>

{#if !wide.current}
	<Dialog title={m.atelier.filters.viewTitle} bind:open={viewOpen}>
		<div class="view">
			<Select
				disabled={total === 0}
				icon={ArrowUpDown}
				label={m.atelier.sort.label}
				options={orders}
				bind:value={() => order, chooseOrder}
			/>
			{@render groupingChoice()}
			<FilterPanel {artworks} ownFields={data.ownFields} bind:filter />
		</div>
		{#snippet footer()}
			<Button disabled={!filtering} onclick={() => (filter = emptyFilter())}>
				{m.atelier.filters.clear}
			</Button>
			<Button onclick={() => (viewOpen = false)} variant="primary">
				{m.atelier.filters.showResults(shown.length)}
			</Button>
		{/snippet}
	</Dialog>
{/if}

<Toast bind:this={toast} />

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

	.summary {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-4);
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

	.grouping-panel {
		display: grid;
		gap: var(--spacing-3);
		width: max-content;
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

	.view {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-8);
	}

	.view .grouping-panel {
		width: auto;
	}
</style>
