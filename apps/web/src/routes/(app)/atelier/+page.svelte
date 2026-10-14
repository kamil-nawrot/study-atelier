<script lang="ts">
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Plus from '@lucide/svelte/icons/plus';
	import { onDestroy, onMount } from 'svelte';
	import {
		Alert,
		Button,
		Icon,
		SearchField,
		Section,
		Select,
		type SelectOption,
		Toast
	} from '@study-atelier/ui';
	import { invalidateAll, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { refreshExpiredImages, resolveImages } from '#lib/collection/artworks.ts';
	import ArtworkWall from '#lib/collection/components/ArtworkWall.svelte';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import { formatRecordNumber } from '#lib/collection/format.ts';
	import { ImageQueue } from '#lib/collection/image-queue.ts';
	import { WALL_PART } from '#lib/collection/masonry.ts';
	import PeriodRail from '#lib/collection/components/PeriodRail.svelte';
	import PeriodStrip from '#lib/collection/components/PeriodStrip.svelte';
	import { groupByEra } from '#lib/collection/periods.ts';
	import { MIN_RAIL_MARGIN, PeriodTracker } from '#lib/collection/period-tracker.svelte.ts';
	import { filterByTitle } from '#lib/collection/search.ts';
	import type { WallArtwork, WallOrder } from '#lib/collection/types.ts';
	import {
		isWallOrder,
		rememberedWallOrder,
		rememberWallOrder
	} from '#lib/collection/wall-order.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps, Snapshot } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let order = $state<WallOrder>(rememberedWallOrder());
	let barHeight = $state(0);
	let wall = $state<HTMLElement>();
	let rendered = $state(WALL_PART);

	const tracker = new PeriodTracker();

	const orders: SelectOption[] = [
		{ value: 'recent', label: m.atelier.sort.recent },
		{ value: 'period', label: m.atelier.sort.period }
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
	const HIGHLIGHT_MS = 2000;
	const REFRESH_DELAY_MS = 100;

	let highlight = $state(page.state.highlight);
	let toast: Toast;

	onMount(() => {
		const trashed = page.state.trashed;
		if (trashed === undefined) return;
		toast.show(m.trash.moved(formatRecordNumber(trashed)));
		replaceState('', {});
	});

	$effect(() => {
		if (highlight === undefined) return;
		const timer = setTimeout(() => {
			highlight = undefined;
			replaceState('', {});
		}, HIGHLIGHT_MS);
		return () => clearTimeout(timer);
	});

	let updated = $state<Record<string, WallArtwork>>({});
	let failedImages: WallArtwork[] = [];
	let refreshTimer: ReturnType<typeof setTimeout> | undefined;

	const imageQueue = new ImageQueue(resolveImages, (resolved) => {
		for (const artwork of resolved) updated[artwork.id] = artwork;
	});

	$effect.pre(() => {
		void data.artworks;
		updated = {};
		imageQueue.reset();
	});

	onDestroy(() => {
		clearTimeout(refreshTimer);
		imageQueue.reset();
	});

	function imageFailed(artwork: WallArtwork): void {
		failedImages.push(artwork);
		clearTimeout(refreshTimer);
		refreshTimer = setTimeout(refreshImages, REFRESH_DELAY_MS);
	}

	async function refreshImages(): Promise<void> {
		const batch = failedImages;
		failedImages = [];
		for (const artwork of await refreshExpiredImages(batch)) updated[artwork.id] = artwork;
	}

	let artworks = $derived(data.artworks.map((artwork) => updated[artwork.id] ?? artwork));
	let imagesUnavailable = $derived(artworks.some((artwork) => artwork.imageUnavailable));
	let matching = $derived(filterByTitle(artworks, query));
	let groups = $derived(order === 'period' ? groupByEra(matching) : []);
	let shown = $derived(order === 'period' ? groups.flatMap((group) => group.artworks) : matching);
	let periodIndexes = $derived(
		new Map(groups.flatMap((group, index) => group.artworks.map((artwork) => [artwork.id, index])))
	);
	let total = $derived(artworks.length);
	let searching = $derived(query.trim() !== '');
	let showPeriods = $derived(groups.length > 0);
	let railFits = $derived(tracker.margin >= MIN_RAIL_MARGIN);

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
		<Button aria-label={m.atelier.add} href={addPath} variant="primary">
			<Icon icon={Plus} />
			<span class="add-label">
				{m.atelier.add}
			</span>
		</Button>
	{/snippet}

	{#snippet strip()}
		{#if showPeriods && !railFits}
			<PeriodStrip current={tracker.current} {groups} />
		{/if}
	{/snippet}

	<header>
		<h1>{m.atelier.title}</h1>
		{#if total > 0}
			<span class="caption">
				{searching || shown.length < total
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
			onimagefailed={imageFailed}
			onnearscreen={(artwork) => imageQueue.request(artwork)}
			{periodIndexes}
			bind:element={wall}
			bind:rendered
		/>
		{#if showPeriods && railFits}
			<PeriodRail current={tracker.current} {groups} width={tracker.margin} />
		{/if}
	{/if}
</AtelierLayout>

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

	.add-label {
		display: none;
	}

	@media (min-width: 768px) {
		.add-label {
			display: inline;
		}
	}
</style>
