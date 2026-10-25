import { untrack } from 'svelte';
import { MediaQuery, SvelteSet } from 'svelte/reactivity';
import type { SelectOption, StepOption } from '@study-atelier/ui';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import type { ResolvedPathname } from '$app/types';
import { applyFilter, emptyFilter, isEmptyFilter } from '#lib/wall/filter/filter.ts';
import { filterFromParams, filterToParams } from '#lib/wall/filter-params/filter-params.ts';
import { filterTags } from '#lib/wall/filter-tags/filter-tags.ts';
import { pruneFilter } from '#lib/wall/filter-prune/filter-prune.ts';
import { setFavourite } from '#lib/wall/favourite-data/favourite-data.ts';
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
import { MIN_RAIL_MARGIN, PeriodTracker } from '#lib/wall/period-tracker/period-tracker.svelte.ts';
import { groupByAuthor, periodIndexes } from '#lib/wall/periods/periods.ts';
import { filterByTitleOrAuthor } from '#lib/wall/search/search.ts';
import {
	isWallOrder,
	rememberedWallOrder,
	rememberWallOrder
} from '#lib/wall/wall-order/wall-order.ts';
import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import { rememberWallSequence } from '#lib/wall/wall-sequence/wall-sequence.ts';
import type { WallGrouping } from '#lib/wall/types/wall-grouping.ts';
import type { WallOrder } from '#lib/wall/types/wall-order.ts';
import type { WallSource } from '#lib/wall/types/wall-source.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';

export const WALL_ORDERS: SelectOption[] = [
	{ value: 'recent', label: m.atelier.sort.recent },
	{ value: 'year', label: m.atelier.sort.year },
	{ value: 'author', label: m.atelier.sort.author }
];

export const GROUPING_STEPS: StepOption[] = WALL_GROUPINGS.flatMap((value) =>
	value === 'none' ? [] : [{ value, label: m.atelier.grouping.steps[value] }]
);

export class WallView {
	order = $state<WallOrder>(rememberedWallOrder());
	filter = $state<CollectionFilter>(emptyFilter());
	grouping = $state<WallGrouping>('none');
	favouriteError = $state<string>();
	panelOpen = $state(false);
	viewOpen = $state(false);
	barHeight = $state(0);
	stripHeight = $state(0);
	readonly images = new WallImages();
	readonly tracker = new PeriodTracker();
	readonly wide = new MediaQuery('min-width: 768px');

	#favourites = $state<Record<string, boolean>>({});
	readonly #source: () => WallSource;
	readonly #writtenQueries = new SvelteSet<string>();

	constructor(
		source: () => WallSource,
		params: Pick<URLSearchParams, 'get' | 'getAll' | 'has' | 'keys'>
	) {
		this.#source = source;
		this.filter = filterFromParams(params);
		this.grouping = groupingFromParams(params);
	}

	#data(): WallSource {
		return this.#source();
	}

	get ownFields(): WallSource['ownFields'] {
		return this.#data().ownFields;
	}

	get collapsed(): SvelteSet<string> {
		return this.#data().collapsed;
	}

	artworks = $derived(
		this.images
			.apply(this.#data().artworks)
			.map((artwork) =>
				artwork.id in this.#favourites
					? { ...artwork, favourite: this.#favourites[artwork.id] }
					: artwork
			)
	);
	imagesUnavailable = $derived(this.artworks.some((artwork) => artwork.imageUnavailable));
	filtered = $derived(applyFilter(this.artworks, this.filter));
	tags = $derived(filterTags(this.filter, this.ownFields));
	filtering = $derived(!isEmptyFilter(this.filter));
	matching = $derived(filterByTitleOrAuthor(this.filtered, this.#data().query));
	grouped = $derived(this.grouping !== 'none');
	depth = $derived(GROUPING_STEPS.findIndex((step) => step.value === this.grouping) + 1);
	groupingLabel = $derived(
		m.atelier.grouping.button(
			this.depth === 0
				? m.atelier.grouping.off
				: GROUPING_STEPS.slice(0, this.depth)
						.map((step) => step.label.toLowerCase())
						.join(' › ')
		)
	);
	filtersLabel = $derived(
		this.filtering ? m.atelier.filters.buttonWithCount(this.tags.length) : m.atelier.filters.button
	);
	ordered = $derived(orderWall(this.matching, this.order));
	sections = $derived(groupWall(this.ordered, this.grouping));
	groups = $derived(
		this.grouped
			? railGroups(this.sections)
			: this.order === 'author'
				? groupByAuthor(this.matching)
				: []
	);
	shown = $derived(this.grouped ? sectionSequence(this.sections) : this.ordered);
	railLabel = $derived(this.grouped ? m.atelier.periods.label : m.atelier.authors.label);
	periodIndexes = $derived(this.grouped ? undefined : periodIndexes(this.groups));
	written = $derived(wallParams(filterToParams(this.filter), this.grouping).toString());
	total = $derived(this.artworks.length);
	showPeriods = $derived(this.groups.length > 1);
	railFits = $derived(
		this.tracker.margin >= MIN_RAIL_MARGIN && !(this.wide.current && this.panelOpen)
	);
	inset = $derived(this.showPeriods && !this.railFits ? this.stripHeight : 0);

	chooseOrder(value: string): void {
		if (!isWallOrder(value)) return;
		this.order = value;
		rememberWallOrder(value);
		window.scrollTo({ top: 0 });
	}

	chooseGrouping(value: string): void {
		const next = WALL_GROUPINGS.find((known) => known === (value || 'none'));
		if (!next || next === this.grouping) return;
		this.grouping = next;
		this.collapsed.clear();
		window.scrollTo({ top: 0 });
	}

	clearFilter(): void {
		this.filter = emptyFilter();
	}

	async toggleFavourite(artwork: WallArtwork): Promise<boolean | undefined> {
		const next = !artwork.favourite;
		this.favouriteError = undefined;
		this.#favourites[artwork.id] = next;
		const { error } = await setFavourite(artwork.id, next);
		if (error) {
			this.#favourites[artwork.id] = !next;
			this.favouriteError = error;
			return undefined;
		}
		return next;
	}

	toggleSection(key: string, open: boolean): void {
		if (open) this.collapsed.delete(key);
		else this.collapsed.add(key);
	}

	toggleAll(): void {
		if (this.collapsed.size > 0) this.collapsed.clear();
		else for (const key of sectionKeys(this.sections)) this.collapsed.add(key);
	}

	follow(): void {
		$effect.pre(() => {
			const pruned = pruneFilter(
				untrack(() => this.filter),
				this.#data().artworks,
				this.ownFields
			);
			if (
				filterToParams(pruned).toString() !== untrack(() => filterToParams(this.filter).toString())
			)
				this.filter = pruned;
		});

		$effect.pre(() => {
			void this.#data().artworks;
			this.images.reset();
		});

		$effect.pre(() => {
			void this.#data().artworks;
			this.#favourites = {};
		});
	}

	keepAddress(): void {
		$effect(() => {
			const written = this.written;
			if (written === untrack(() => page.url.searchParams.toString())) return;
			untrack(() => this.#writtenQueries.add(written));
			const target =
				`${resolve('/(app)/atelier')}${written ? `?${written}` : ''}` as ResolvedPathname;
			void goto(target, { replace: true, reset: false });
		});

		$effect(() => {
			const current = page.url.searchParams.toString();
			if (untrack(() => this.#writtenQueries.delete(current))) return;
			if (current === untrack(() => this.written)) return;
			this.grouping = groupingFromParams(page.url.searchParams);
			this.filter = pruneFilter(
				filterFromParams(page.url.searchParams),
				untrack(() => this.artworks),
				this.ownFields
			);
		});

		$effect(() => {
			rememberWallSequence({
				query: this.written,
				numbers: this.shown.map((artwork) => artwork.number)
			});
		});
	}
}
