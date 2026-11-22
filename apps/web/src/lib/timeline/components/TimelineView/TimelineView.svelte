<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { overlayScrollbar } from '@study-atelier/ui';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { availableSteps, eraView, focusView, panView } from '#lib/timeline/scale/scale.ts';
	import { TimelineCamera } from '#lib/timeline/camera/camera.svelte.ts';
	import { readingText } from '#lib/timeline/reading/reading.ts';
	import type { StepKey } from '#lib/timeline/types/step-key.ts';
	import {
		EVENT_LANES,
		EVENT_LANES_NARROW,
		eventsIn,
		lanesForEra
	} from '#lib/timeline/event-lanes/event-lanes.ts';
	import {
		NARROW_WIDTH,
		orientationFor,
		panelOverStage,
		roomBesidePanel,
		verticalLength
	} from '#lib/timeline/stage/stage.ts';
	import { AXIS_GAP, AxisRoom } from '#lib/timeline/axis-room/axis-room.svelte.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
	import type { TimelineFilter } from '#lib/timeline/types/timeline-filter.ts';
	import type { TimelinePlace } from '#lib/timeline/types/timeline-place.ts';
	import type { TimelineSelection } from '#lib/timeline/types/timeline-selection.ts';
	import { rememberEra } from '#lib/timeline/start/start.ts';
	import { entriesSpan, eraOf, eras, spanOfYears, yearAt } from '#lib/timeline/time/time.ts';
	import type { Era } from '#lib/timeline/types/era.ts';
	import type { TimeSpan } from '#lib/timeline/types/time-span.ts';
	import FilterTags from '#lib/wall/components/FilterTags/FilterTags.svelte';
	import {
		applyTimelineFilter,
		artworkLanes as lanesForArtworks,
		emptyTimelineFilter,
		forOtherEra,
		isEmptyTimelineFilter,
		laneColour,
		lanesOf,
		removeTimelineTag,
		tagLane,
		timelineTags
	} from '#lib/timeline/filter/filter.ts';
	import { labelCut, labelWidth as measureLabel } from '#lib/timeline/label-width/label-width.ts';
	import EraStrip from '#lib/timeline/components/EraStrip/EraStrip.svelte';
	import EventPanel from '#lib/timeline/components/EventPanel/EventPanel.svelte';
	import TimelineControls from '#lib/timeline/components/TimelineControls/TimelineControls.svelte';
	import TimelineEvents from '#lib/timeline/components/TimelineEvents/TimelineEvents.svelte';
	import TimelineArtworks from '#lib/timeline/components/TimelineArtworks/TimelineArtworks.svelte';
	import TimelineStage from '#lib/timeline/components/TimelineStage/TimelineStage.svelte';

	type Props = {
		initialEra: EraCode;
		initialFocus?: TimeSpan;
		artworks?: readonly WallArtwork[];
		events?: readonly TimelineEvent[];
		onerachange?: (code: EraCode) => void;
		filter?: TimelineFilter;
		showEvents?: boolean;
		showSpans?: boolean;
		onfilters?: () => void;
	};

	let {
		initialEra,
		initialFocus,
		artworks = [],
		events = [],
		onerachange,
		filter = $bindable(emptyTimelineFilter()),
		showEvents = true,
		showSpans = true,
		onfilters
	}: Props = $props();

	const NOW_SHARE = 40;
	const SPOKEN_DELAY_MS = 500;
	const PANEL_ROOM_GAP = 12;
	const PANEL_MIN = 160;
	const labelWidth = (event: TimelineEvent): number => measureLabel(event.name);
	const nameCut = (event: TimelineEvent): boolean => labelCut(event.name);

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
	let anchor = $state<HTMLElement>();
	let splitWidth = $state(0);
	let stageHeight = $state(0);
	const axisRoom = new AxisRoom();
	const wide = new MediaQuery('min-width: 768px');

	let allEras = $derived(eras(undefined, entriesSpan([...artworks, ...events])));
	let era = $derived(allEras.find((candidate) => candidate.code === code) as Era);
	let steps = $derived(availableSteps(era));
	let collection = $derived(applyTimelineFilter(artworks, filter));
	let filtering = $derived(!isEmptyTimelineFilter(filter));
	let tags = $derived(timelineTags(filter));
	let artworkLanes = $derived(lanesForArtworks(filter, collection));
	let orientation = $derived(orientationFor(width));
	let eraEvents = $derived(eventsIn(events, era));
	let laidLabelWidth = $derived(orientation === 'vertical' ? () => 0 : labelWidth);
	let selectedEvent = $derived(
		showEvents && selected?.kind === 'event'
			? events.find((event) => event.id === selected?.id)
			: undefined
	);
	let room = $derived(
		selectedEvent && !wide.current ? roomBesidePanel(axisRoom.room) : axisRoom.room
	);
	let fullRoom = $derived(axisRoom.room > 0 ? axisRoom.room + AXIS_GAP : 0);
	let panelHeight = $derived(
		wide.current ? stageHeight : Math.max(axisRoom.room - stageHeight - PANEL_ROOM_GAP, PANEL_MIN)
	);
	let lanes = $derived(
		lanesForEra(
			eraEvents,
			era,
			orientation === 'vertical' ? verticalLength(viewportHeight, wide.current ? 0 : room) : width,
			laidLabelWidth,
			width < NARROW_WIDTH ? EVENT_LANES_NARROW : EVENT_LANES
		)
	);
	let tint = $derived(
		selectedEvent ? spanOfYears(selectedEvent.yearFrom, selectedEvent.yearTo) : undefined
	);
	let reading = $derived({
		start: camera.view.center - camera.view.span / NOW_SHARE,
		end: camera.view.center + camera.view.span / NOW_SHARE
	});
	let now = $derived(showEvents ? eventsIn(eraEvents, reading) : []);
	let spokenText = $derived(readingText(yearAt(camera.view.center), now));
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

	function chooseEvent(event: TimelineEvent): void {
		toggle('event', event.id);
		if (wide.current || selected === null) return;
		const span = spanOfYears(event.yearFrom, event.yearTo);
		const by = (span.start + span.end) / 2 - camera.target.center;
		camera.animateTo(panView(camera.target, by, era));
	}

	function closeEvent(): void {
		const target = anchor;
		selected = null;
		target?.focus();
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

<div class="timeline" data-fill-stage>
	<EraStrip current={code} eras={allEras} onselect={openEra} />

	<TimelineControls
		{code}
		onera={openEra}
		onmove={(direction) => camera.moveStep(direction)}
		onstep={(key) => camera.chooseStep(key)}
		step={camera.step}
		{steps}
	/>

	<div class="tags">
		<FilterTags
			colour={(tag) => {
				const at = tagLane(filter, tag);
				return at < 0 ? undefined : laneColour(at);
			}}
			onclear={() => (filter = emptyTimelineFilter())}
			onmore={onfilters}
			onremove={(tag) => (filter = removeTimelineTag(filter, tag))}
			{tags}
		/>
	</div>

	<p class="visually-hidden" aria-live="polite">{spoken}</p>

	{#if orientation === 'vertical' && showEvents && eraEvents.length === 0}
		<p class="caption">{m.timeline.noEvents}</p>
	{/if}

	<div class="split" class:over={panelOverStage(splitWidth)} bind:clientWidth={splitWidth}>
		<div
			class="stage"
			{@attach axisRoom.attach()}
			bind:clientHeight={stageHeight}
			bind:clientWidth={width}
		>
			<TimelineStage
				artworkLanes={orientation === 'horizontal' ? artworkLanes.length : 0}
				axisRoom={wide.current ? fullRoom : room}
				{era}
				eventLanes={showEvents && (orientation === 'horizontal' || eraEvents.length > 0)
					? lanes
					: 0}
				onbackground={() => (selected = null)}
				onkeypan={(share) => camera.panShare(share)}
				onpan={(by) => camera.pan(by)}
				onsettle={() => camera.settle()}
				onstep={(direction, anchor) => camera.moveStep(direction, anchor)}
				{orientation}
				readingNames={orientation === 'vertical' ? now.map((event) => event.name) : []}
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
							labelWidth={laidLabelWidth}
							{lanes}
							layoutSpan={camera.target.span}
							{nameCut}
							onselect={chooseEvent}
							selected={selected?.kind === 'event' ? selected.id : null}
							bind:anchor
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
						spans={showSpans}
					/>
				{/snippet}
			</TimelineStage>
		</div>
		{#if selectedEvent}
			{@const event = selectedEvent}
			<aside style:max-height="{panelHeight}px" {@attach overlayScrollbar()}>
				<EventPanel {event} onclose={closeEvent} onwhole={() => showWhole(event)} />
			</aside>
		{/if}
	</div>
</div>

<style>
	.timeline {
		display: grid;
		gap: var(--spacing-3);
	}

	.tags {
		display: grid;
		align-content: center;
		min-height: var(--size-control);
	}

	.split {
		display: grid;
		gap: var(--spacing-3);
		position: relative;
		left: calc(-1 * var(--content-bleed, 0px));
		width: calc(100% + 2 * var(--content-bleed, 0px));
	}

	.stage {
		min-width: 0;
	}

	aside {
		overflow-y: auto;
	}

	@media (min-width: 768px) {
		.split {
			position: relative;
			display: flex;
			align-items: flex-start;
			gap: var(--spacing-8);
		}

		.stage {
			flex: 1;
		}

		aside {
			flex: none;
			width: 320px;
		}

		.over aside {
			position: absolute;
			top: 0;
			right: 0;
			padding: var(--spacing-4);
			border-left: var(--border-width-base) solid var(--color-line);
			background: var(--color-bg);
		}
	}
</style>
