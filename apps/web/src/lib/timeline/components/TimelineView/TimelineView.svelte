<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { eraTitle } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { availableSteps, eraView, focusView } from '#lib/timeline/scale/scale.ts';
	import { TimelineCamera } from '#lib/timeline/camera/camera.svelte.ts';
	import { readingText } from '#lib/timeline/reading/reading.ts';
	import type { StepKey } from '#lib/timeline/types/step-key.ts';
	import {
		EVENT_LANES,
		EVENT_LANES_NARROW,
		eventsIn,
		lanesForEra
	} from '#lib/timeline/event-lanes/event-lanes.ts';
	import { NARROW_WIDTH, orientationFor, verticalLength } from '#lib/timeline/stage/stage.ts';
	import type { ArtworkLane } from '#lib/timeline/types/artwork-lane.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';
	import type { TimelinePlace } from '#lib/timeline/types/timeline-place.ts';
	import type { TimelineSelection } from '#lib/timeline/types/timeline-selection.ts';
	import { eraOfYear, rememberEra } from '#lib/timeline/start/start.ts';
	import {
		distanceToSpan,
		entriesSpan,
		eraOf,
		eras,
		overlaps,
		spanOfYears,
		yearAt
	} from '#lib/timeline/time/time.ts';
	import type { Era } from '#lib/timeline/types/era.ts';
	import type { TimeSpan } from '#lib/timeline/types/time-span.ts';
	import FilterTags from '#lib/wall/components/FilterTags/FilterTags.svelte';
	import {
		applyTimelineFilter,
		artworksIn,
		emptyTimelineFilter,
		forOtherEra,
		inLane,
		isEmptyTimelineFilter,
		laneColour,
		lanesOf,
		removeTimelineTag,
		tagLane,
		timelineTags
	} from '#lib/timeline/filter/filter.ts';
	import { labelWidth as measureLabel } from '#lib/timeline/label-width/label-width.ts';
	import EraStrip from '#lib/timeline/components/EraStrip/EraStrip.svelte';
	import EventCard from '#lib/timeline/components/EventCard/EventCard.svelte';
	import EventDeleteDialog from '#lib/timeline/components/EventDeleteDialog/EventDeleteDialog.svelte';
	import ReadingArtworks from '#lib/timeline/components/ReadingArtworks/ReadingArtworks.svelte';
	import TimelineControls from '#lib/timeline/components/TimelineControls/TimelineControls.svelte';
	import TimelineEvents from '#lib/timeline/components/TimelineEvents/TimelineEvents.svelte';
	import TimelineArtworks from '#lib/timeline/components/TimelineArtworks/TimelineArtworks.svelte';
	import TimelineStage from '#lib/timeline/components/TimelineStage/TimelineStage.svelte';

	type Props = {
		initialEra: EraCode;
		initialFocus?: TimeSpan;
		artworks?: readonly WallArtwork[];
		events?: readonly TimelineEvent[];
		ondeleted?: (event: TimelineEvent) => void | Promise<void>;
		onerachange?: (code: EraCode) => void;
		filter?: TimelineFilter;
		showEvents?: boolean;
		readingArtworks?: boolean;
	};

	let {
		initialEra,
		initialFocus,
		artworks = [],
		events = [],
		ondeleted,
		onerachange,
		filter = $bindable(emptyTimelineFilter()),
		showEvents = true,
		readingArtworks = false
	}: Props = $props();

	const NOW_SHARE = 40;
	const SPOKEN_DELAY_MS = 500;
	const labelWidth = (event: TimelineEvent): number => measureLabel(event.name);

	const start = untrack(() => {
		const first = eraOf(initialEra, undefined, entriesSpan([...artworks, ...events]));
		return initialFocus
			? focusView(first, initialFocus)
			: { step: 'era' as StepKey, view: eraView(first) };
	});

	let code = $state<EraCode>(untrack(() => initialEra));
	const camera = new TimelineCamera(start, () => era);
	let selected = $state<TimelineSelection>(null);
	let width = $state(0);
	let viewportHeight = $state(0);
	let deleteOpen = $state(false);

	let allEras = $derived(eras(undefined, entriesSpan([...artworks, ...events])));
	let era = $derived(allEras.find((candidate) => candidate.code === code) as Era);
	let steps = $derived(availableSteps(era));
	let collection = $derived(applyTimelineFilter(artworks, filter));
	let filtering = $derived(!isEmptyTimelineFilter(filter));
	let tags = $derived(timelineTags(filter));
	let artworkLanes = $derived<ArtworkLane[]>(
		filter.lanes.map((lane, laneAt) => ({
			key: `${lane.field}:${lane.value}`,
			name: lane.value,
			colour: laneColour(laneAt),
			artworks: collection.filter((artwork) => inLane(artwork, lane))
		}))
	);
	let orientation = $derived(orientationFor(width));
	let eraEvents = $derived(eventsIn(events, era));
	let lanes = $derived(
		lanesForEra(
			eraEvents,
			era,
			orientation === 'vertical' ? verticalLength(viewportHeight) : width,
			labelWidth,
			width < NARROW_WIDTH ? EVENT_LANES_NARROW : EVENT_LANES
		)
	);
	let selectedEvent = $derived(
		showEvents && selected?.kind === 'event'
			? events.find((event) => event.id === selected?.id)
			: undefined
	);
	let tint = $derived(
		selectedEvent ? spanOfYears(selectedEvent.yearFrom, selectedEvent.yearTo) : undefined
	);
	let reading = $derived({
		start: camera.view.center - camera.view.span / NOW_SHARE,
		end: camera.view.center + camera.view.span / NOW_SHARE
	});
	let now = $derived(showEvents ? eventsIn(eraEvents, reading) : []);
	let nowArtworks = $derived(
		readingArtworks
			? artworksIn(collection, reading).sort((a, b) => distanceToReading(a) - distanceToReading(b))
			: []
	);
	let spokenText = $derived(readingText(yearAt(camera.view.center), now, nowArtworks));
	let spoken = $state('');

	$effect(() => {
		const text = spokenText;
		const timer = setTimeout(() => (spoken = text), SPOKEN_DELAY_MS);
		return () => clearTimeout(timer);
	});

	$effect(() => {
		const current = selected;
		if (!current) return;
		const gone =
			current.kind === 'event'
				? !showEvents
				: !collection.some((artwork) => artwork.id === current.id);
		if (gone) untrack(() => (selected = null));
	});

	function spanOf(item: { yearFrom: number | null; yearTo: number | null }): TimeSpan | undefined {
		return item.yearTo === null ? undefined : spanOfYears(item.yearFrom, item.yearTo);
	}

	function artworksOf(event: TimelineEvent): WallArtwork[] {
		return artworksIn(collection, spanOfYears(event.yearFrom, event.yearTo));
	}

	function distanceToReading(artwork: WallArtwork): number {
		const span = spanOf(artwork);
		return span ? distanceToSpan(span, camera.view.center) : Infinity;
	}

	function laneColourOf(artwork: WallArtwork): string | undefined {
		const [first] = lanesOf(artwork, filter);
		return first === undefined ? undefined : laneColour(first);
	}

	function toggle(kind: 'artwork' | 'event', id: string): void {
		selected = selected?.kind === kind && selected.id === id ? null : { kind, id };
	}

	function showWhole(event: TimelineEvent): void {
		const focus = focusView(era, spanOfYears(event.yearFrom, event.yearTo));
		camera.step = focus.step;
		camera.animateTo(focus.view);
	}

	function chooseArtwork(artwork: WallArtwork): void {
		const span = spanOf(artwork);
		if (span && !overlaps(span, era) && artwork.yearTo !== null) openEra(eraOfYear(artwork.yearTo));
		selected = { kind: 'artwork', id: artwork.id };
	}

	export function capture(): TimelinePlace {
		return { code, step: camera.step, view: { ...camera.target }, selected };
	}

	export function restore(place: TimelinePlace): void {
		code = place.code;
		camera.step = place.step;
		selected = place.selected;
		onerachange?.(place.code);
		camera.showNow(place.view);
	}

	function openEra(next: EraCode): void {
		code = next;
		camera.step = 'era';
		selected = null;
		filter = forOtherEra(filter);
		rememberEra(next);
		onerachange?.(next);
		camera.showNow(eraView(allEras.find((candidate) => candidate.code === next) as Era));
	}

	onDestroy(() => camera.stop());
</script>

<svelte:window bind:innerHeight={viewportHeight} />

<div class="timeline">
	<EraStrip current={code} eras={allEras} onselect={openEra} view={camera.view} />

	<p class="era-name" aria-live="polite">{eraTitle(code)}</p>

	<TimelineControls
		{code}
		onera={openEra}
		onmove={(direction) => camera.moveStep(direction)}
		onstep={(key) => camera.chooseStep(key)}
		step={camera.step}
		{steps}
	/>

	<FilterTags
		colour={(tag) => {
			const at = tagLane(filter, tag);
			return at < 0 ? undefined : laneColour(at);
		}}
		onclear={() => (filter = emptyTimelineFilter())}
		onremove={(tag) => (filter = removeTimelineTag(filter, tag))}
		{tags}
	/>

	<p class="visually-hidden" aria-live="polite">{spoken}</p>

	{#if orientation === 'vertical' && showEvents && eraEvents.length === 0}
		<p class="caption">{m.timeline.noEvents}</p>
	{/if}

	<div bind:clientWidth={width}>
		<TimelineStage
			artworkLanes={orientation === 'horizontal' ? artworkLanes.length : 0}
			{era}
			eventLanes={showEvents ? lanes : 0}
			onbackground={() => (selected = null)}
			onkeypan={(share) => camera.panShare(share)}
			onpan={(by) => camera.pan(by)}
			onsettle={() => camera.settle()}
			onstep={(direction, anchor) => camera.moveStep(direction, anchor)}
			{orientation}
			{tint}
			view={camera.view}
			{viewportHeight}
		>
			{#snippet events(geometry)}
				{#if showEvents}
					<TimelineEvents
						{era}
						events={eraEvents}
						{geometry}
						{labelWidth}
						{lanes}
						layoutSpan={camera.target.span}
						onselect={(event) => toggle('event', event.id)}
						selected={selected?.kind === 'event' ? selected.id : null}
					/>
				{/if}
			{/snippet}
			{#snippet artworks(geometry)}
				<TimelineArtworks
					artworks={collection}
					colourOf={laneColourOf}
					empty={filtering ? m.timeline.filters.empty : undefined}
					{era}
					{geometry}
					lanes={artworkLanes}
					layoutSpan={camera.target.span}
					onselect={(artwork) => toggle('artwork', artwork.id)}
					selected={selected?.kind === 'artwork' ? selected.id : null}
				/>
			{/snippet}
		</TimelineStage>
	</div>

	{#if readingArtworks}
		<ReadingArtworks artworks={nowArtworks} onchoose={chooseArtwork} />
	{/if}

	{#if selectedEvent}
		{@const event = selectedEvent}
		<EventCard
			artworks={artworksOf(event)}
			{event}
			onartwork={chooseArtwork}
			ondelete={() => (deleteOpen = true)}
			onwhole={() => showWhole(event)}
		/>
	{/if}
</div>

{#if selectedEvent}
	<EventDeleteDialog
		event={selectedEvent}
		ondeleted={(event) => {
			selected = null;
			return ondeleted?.(event);
		}}
		bind:open={deleteOpen}
	/>
{/if}

<style>
	.timeline {
		display: grid;
		gap: var(--spacing-3);
	}

	.era-name {
		justify-self: center;
		font-weight: var(--font-weight-medium);
	}
</style>
