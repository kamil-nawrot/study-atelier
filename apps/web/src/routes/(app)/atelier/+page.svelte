<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Plus from '@lucide/svelte/icons/plus';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import X from '@lucide/svelte/icons/x';
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
		Toast
	} from '@study-atelier/ui';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import ArtworkWall from '#lib/collection/components/ArtworkWall.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import FilterPanel from '#lib/collection/components/FilterPanel.svelte';
	import FilterTags from '#lib/collection/components/FilterTags.svelte';
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
	} from '#lib/collection/filter.ts';
	import { favouriteToast, setFavourite } from '#lib/collection/favourite.ts';
	import { formatRecordNumber } from '#lib/collection/format.ts';
	import { WALL_PART } from '#lib/collection/masonry.ts';
	import PeriodRail from '#lib/collection/components/PeriodRail.svelte';
	import PeriodStrip from '#lib/collection/components/PeriodStrip.svelte';
	import { groupByAuthor, groupByEra } from '#lib/collection/periods.ts';
	import { MIN_RAIL_MARGIN, PeriodTracker } from '#lib/collection/period-tracker.svelte.ts';
	import { filterByTitleOrAuthor } from '#lib/collection/search.ts';
	import type { WallArtwork, WallOrder } from '#lib/collection/types.ts';
	import {
		isWallOrder,
		rememberedWallOrder,
		rememberWallOrder
	} from '#lib/collection/wall-order.ts';
	import { WallImages } from '#lib/collection/wall-images.svelte.ts';
	import { rememberWallSequence } from '#lib/collection/wall-sequence.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let order = $state<WallOrder>(rememberedWallOrder());
	let filter = $state(filterFromParams(page.url.searchParams));
	let panelOpen = $state(false);
	let panelMounted = $state(false);
	let viewOpen = $state(false);
	let barHeight = $state(0);
	let wall = $state<HTMLElement>();
	let rendered = $state(WALL_PART);

	const tracker = new PeriodTracker();
	const wide = new MediaQuery('min-width: 768px');
	const motion = new MediaQuery('prefers-reduced-motion: no-preference');

	const orders: SelectOption[] = [
		{ value: 'recent', label: m.atelier.sort.recent },
		{ value: 'period', label: m.atelier.sort.period },
		{ value: 'author', label: m.atelier.sort.author }
	];

	function chooseOrder(value: string): void {
		if (!isWallOrder(value)) return;
		order = value;
		rememberWallOrder(value);
		window.scrollTo({ top: 0 });
	}

	export const snapshot: Snapshot<{ query: string; rendered: number }> = {
		capture: () => ({ query, rendered }),
		restore: (value) => {
			query = value.query;
			rendered = value.rendered;
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
			data.artworks
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
	let tags = $derived(filterTags(filter));
	let filtering = $derived(!isEmptyFilter(filter));
	let matching = $derived(filterByTitleOrAuthor(filtered, query));
	let groups = $derived(
		order === 'period' ? groupByEra(matching) : order === 'author' ? groupByAuthor(matching) : []
	);
	let shown = $derived(order === 'recent' ? matching : groups.flatMap((group) => group.artworks));
	let railLabel = $derived(order === 'author' ? m.atelier.authors.label : m.atelier.periods.label);
	let periodIndexes = $derived(
		new Map(groups.flatMap((group, index) => group.artworks.map((artwork) => [artwork.id, index])))
	);
	let total = $derived(artworks.length);
	let searching = $derived(query.trim() !== '');
	let showPeriods = $derived(groups.length > 0);
	let panelShown = $derived(wide.current && panelOpen);

	$effect(() => {
		if (panelOpen) panelMounted = true;
		else if (!motion.current) panelMounted = false;
	});

	function unmountPanel(event: TransitionEvent): void {
		if (event.propertyName === 'width' && !panelOpen) panelMounted = false;
	}
	let railFits = $derived(tracker.margin >= MIN_RAIL_MARGIN && !panelShown);

	const writtenQueries = new SvelteSet<string>();

	$effect(() => {
		const written = filterToParams(filter).toString();
		if (written === untrack(() => page.url.searchParams.toString())) return;
		untrack(() => writtenQueries.add(written));
		const target =
			`${resolve('/(app)/atelier')}${written ? `?${written}` : ''}` as ResolvedPathname;
		void goto(target, { replace: true, reset: false });
	});

	$effect(() => {
		const current = page.url.searchParams.toString();
		if (untrack(() => writtenQueries.delete(current))) return;
		if (current === untrack(() => filterToParams(filter).toString())) return;
		filter = pruneFilter(
			filterFromParams(page.url.searchParams),
			untrack(() => artworks)
		);
	});

	$effect(() => {
		rememberWallSequence({
			query: filterToParams(filter).toString(),
			numbers: shown.map((artwork) => artwork.number)
		});
	});

	$effect(() => {
		if (!wall || !showPeriods) return;
		return tracker.track(wall, barHeight);
	});
</script>

<AtelierLayout email={data.session.user.email ?? ''} title={m.atelier.title} bind:barHeight>
	{#snippet bar()}
		<div class="search">
			<SearchField
				disabled={total === 0}
				label={m.atelier.search}
				placeholder={m.atelier.search}
				bind:value={query}
			/>
		</div>
		{#if wide.current}
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
		<Button
			aria-expanded={wide.current ? panelOpen : undefined}
			aria-haspopup={wide.current ? undefined : 'dialog'}
			aria-label={wide.current ? undefined : m.atelier.filters.viewButton}
			disabled={total === 0}
			onclick={() => (wide.current ? (panelOpen = !panelOpen) : (viewOpen = true))}
			variant={!wide.current && filtering ? 'primary' : 'secondary'}
		>
			<Icon icon={SlidersHorizontal} />
			<span class="filters-label">
				{filtering ? m.atelier.filters.buttonWithCount(tags.length) : m.atelier.filters.button}
			</span>
		</Button>
		<Button aria-label={m.atelier.add} href={addPath} variant="primary">
			<Icon icon={Plus} />
			<span class="add-label">
				{m.atelier.add}
			</span>
		</Button>
	{/snippet}

	{#snippet panel()}
		{#if wide.current}
			<div class="filters-slot" class:open={panelOpen} ontransitionend={unmountPanel}>
				{#if panelMounted}
					<aside class="filters" aria-label={m.atelier.filters.title}>
						<div class="filters-top">
							<h2>{m.atelier.filters.title}</h2>
							<button
								class="icon-button"
								aria-label={m.atelier.filters.closePanel}
								onclick={() => (panelOpen = false)}
								type="button"
							>
								<Icon icon={X} />
							</button>
						</div>
						<FilterPanel {artworks} bind:filter />
						<div class="filters-bottom">
							<span class="caption">{m.atelier.filteredCount(shown.length, total)}</span>
							<Button disabled={!filtering} onclick={() => (filter = emptyFilter())}>
								{m.atelier.filters.clear}
							</Button>
						</div>
					</aside>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet strip()}
		{#if showPeriods && !railFits}
			<PeriodStrip current={tracker.current} {groups} label={railLabel} />
		{/if}
	{/snippet}

	<header>
		<h1>{m.atelier.title}</h1>
		{#if total > 0}
			<span class="caption">
				{searching || filtering || shown.length < total
					? m.atelier.filteredCount(shown.length, total)
					: m.atelier.count(total)}
			</span>
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
	{:else if shown.length === 0 && !searching}
		<div class="state">
			<Section>
				<h2>{m.atelier.periods.emptyTitle}</h2>
				<p class="lead">{m.atelier.periods.empty}</p>
				<div>
					<Button onclick={() => chooseOrder('recent')}>
						{m.atelier.periods.showRecent}
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
		<ArtworkWall
			artworks={shown}
			{highlight}
			onfavourite={toggleFavourite}
			onimagefailed={(artwork) => images.failed(artwork)}
			onnearscreen={(artwork) => images.request(artwork)}
			{periodIndexes}
			bind:element={wall}
			bind:rendered
		/>
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
			<FilterPanel {artworks} bind:filter />
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
	.search {
		flex: 1;
		min-width: 0;
		max-width: var(--size-content-default);
		margin-inline-start: max(0px, calc((100% - var(--size-content-wide)) / 2));
	}

	.sort {
		flex: none;
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

	.add-label,
	.filters-label {
		display: none;
	}

	.view {
		display: grid;
		gap: var(--spacing-8);
	}

	.filters-slot {
		position: sticky;
		top: var(--bar-height);
		flex: none;
		width: 0;
		overflow: hidden;
		visibility: hidden;
	}

	.filters-slot.open {
		width: 380px;
		visibility: visible;
	}

	.filters {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
		box-sizing: border-box;
		width: 380px;
		max-height: calc(100dvh - var(--bar-height));
		padding: var(--spacing-4) var(--spacing-6) var(--spacing-12);
		overflow-y: auto;
		scrollbar-gutter: stable;
		border-left: var(--border-width-base) solid var(--color-line);
	}

	@media (prefers-reduced-motion: no-preference) {
		.filters-slot {
			transition:
				width var(--duration-short) ease-out,
				visibility var(--duration-short);
		}
	}

	.filters-top,
	.filters-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
	}

	.filters-top h2 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.icon-button {
		display: flex;
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	@media (min-width: 768px) {
		.add-label,
		.filters-label {
			display: inline;
		}
	}
</style>
