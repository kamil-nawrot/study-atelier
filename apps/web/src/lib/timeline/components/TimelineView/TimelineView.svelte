<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { onDestroy, untrack } from 'svelte';
	import { Alert, Button, Dialog, Icon, ToggleTag } from '@study-atelier/ui';
	import { ERA_CODES, eraTitle } from '#lib/catalogue/eras/eras.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		availableSteps,
		eraView,
		focusView,
		nextStep,
		panView,
		stepView,
		type StepKey
	} from '#lib/timeline/scale/scale.ts';
	import {
		EVENT_LANES,
		EVENT_LANES_NARROW,
		eventsIn,
		lanesForEra
	} from '#lib/timeline/event-lanes/event-lanes.ts';
	import { NARROW_WIDTH, orientationFor, verticalLength } from '#lib/timeline/stage/stage.ts';
	import { deleteTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
	import type { ArtworkLane, TimelineEvent, TimelineFilter } from '#lib/timeline/types.ts';
	import { eraOfYear, rememberEra } from '#lib/timeline/start/start.ts';
	import {
		distanceToSpan,
		entriesSpan,
		eraOf,
		eras,
		overlaps,
		spanOfYears,
		yearAt,
		type Era,
		type TimeSpan,
		type View
	} from '#lib/timeline/time/time.ts';
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

	type Selection = { kind: 'artwork' | 'event'; id: string } | null;

	export type TimelinePlace = {
		code: EraCode;
		step: StepKey;
		view: View;
		selected: Selection;
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
	const READING_TITLES = 3;
	const SPOKEN_DELAY_MS = 500;

	const STEP_ANIMATION_MS = 400;
	const start = untrack(() => {
		const first = eraOf(initialEra, undefined, entriesSpan([...artworks, ...events]));
		return initialFocus
			? focusView(first, initialFocus)
			: { step: 'era' as StepKey, view: eraView(first) };
	});

	let code = $state<EraCode>(untrack(() => initialEra));
	let step = $state<StepKey>(start.step);
	let target = $state<View>(start.view);
	let view = $state<View>(start.view);
	let selected = $state<Selection>(null);
	let width = $state(0);
	let viewportHeight = $state(0);
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string>();
	let frame = 0;

	let allEras = $derived(eras(undefined, entriesSpan([...artworks, ...events])));
	let era = $derived(allEras.find((candidate) => candidate.code === code) as Era);
	let steps = $derived(availableSteps(era));
	let index = $derived(ERA_CODES.indexOf(code));
	let previous = $derived(index > 0 ? ERA_CODES[index - 1] : undefined);
	let next = $derived(index < ERA_CODES.length - 1 ? ERA_CODES[index + 1] : undefined);
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
	let readingYear = $derived(yearAt(view.center));
	let reading = $derived({
		start: view.center - view.span / NOW_SHARE,
		end: view.center + view.span / NOW_SHARE
	});
	let now = $derived(showEvents ? eventsIn(eraEvents, reading) : []);
	let nowArtworks = $derived(
		readingArtworks
			? artworksIn(collection, reading).sort((a, b) => distanceToReading(a) - distanceToReading(b))
			: []
	);
	let nowParts = $derived(
		now.length > 0 ? [m.timeline.nowEvents(now.map((event) => event.name).join(', '))] : []
	);

	let atReading = $derived(now.length > 0 || nowArtworks.length > 0);
	let spokenText = $derived(
		atReading
			? m.timeline.now(m.atelier.year(readingYear, false), [
					...nowParts,
					...(nowArtworks.length > 0
						? [
								m.timeline.nowArtworks(
									nowArtworks
										.slice(0, READING_TITLES)
										.map((artwork) => artwork.title)
										.join(', '),
									nowArtworks.length - READING_TITLES
								)
							]
						: [])
				])
			: ''
	);
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

	function labelWidth(event: TimelineEvent): number {
		return measureLabel(event.name);
	}

	function spanOf(item: { yearFrom: number | null; yearTo: number | null }): TimeSpan | undefined {
		return item.yearTo === null ? undefined : spanOfYears(item.yearFrom, item.yearTo);
	}

	function artworksOf(event: TimelineEvent): WallArtwork[] {
		return artworksIn(collection, spanOfYears(event.yearFrom, event.yearTo));
	}

	function distanceToReading(artwork: WallArtwork): number {
		const span = spanOf(artwork);
		return span ? distanceToSpan(span, view.center) : Infinity;
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
		step = focus.step;
		animateTo(focus.view);
	}

	function askToDelete(): void {
		deleteError = undefined;
		deleteOpen = true;
	}

	async function remove(): Promise<void> {
		const event = selectedEvent;
		if (!event || deleting) return;
		deleting = true;
		deleteError = undefined;
		const result = await deleteTimelineEvent(event.id);
		deleting = false;
		if (result.error) {
			deleteError = result.error;
			return;
		}
		deleteOpen = false;
		selected = null;
		await ondeleted?.(event);
	}

	function reducedMotion(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function stopAnimation(): void {
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
	}

	function showNow(next: View): void {
		stopAnimation();
		target = next;
		view = next;
	}

	function animateTo(next: View): void {
		target = next;
		if (reducedMotion()) {
			showNow(next);
			return;
		}
		stopAnimation();
		const from = view;
		const started = performance.now();
		const tick = (now: number): void => {
			const progress = Math.min(1, (now - started) / STEP_ANIMATION_MS);
			const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
			view = {
				center: from.center + (next.center - from.center) * eased,
				span: Math.exp(Math.log(from.span) + (Math.log(next.span) - Math.log(from.span)) * eased)
			};
			frame = progress < 1 ? requestAnimationFrame(tick) : 0;
		};
		frame = requestAnimationFrame(tick);
	}

	function chooseStep(key: StepKey, anchor = 0.5): void {
		step = key;
		animateTo(stepView(target, key, era, anchor));
	}

	function moveStep(direction: 1 | -1, anchor = 0.5): void {
		const key = nextStep(step, era, direction);
		if (key !== step) chooseStep(key, anchor);
	}

	function settle(): void {
		if (frame) showNow(target);
	}

	function pan(by: number): void {
		showNow(panView(target, by, era));
	}

	function panShare(share: number): void {
		pan(share * target.span);
	}

	function chooseArtwork(artwork: WallArtwork): void {
		const span = spanOf(artwork);
		if (span && !overlaps(span, era) && artwork.yearTo !== null) openEra(eraOfYear(artwork.yearTo));
		selected = { kind: 'artwork', id: artwork.id };
	}

	export function capture(): TimelinePlace {
		return { code, step, view: { ...target }, selected };
	}

	export function restore(place: TimelinePlace): void {
		code = place.code;
		step = place.step;
		selected = place.selected;
		onerachange?.(place.code);
		showNow(place.view);
	}

	function openEra(next: EraCode): void {
		code = next;
		step = 'era';
		selected = null;
		filter = forOtherEra(filter);
		rememberEra(next);
		onerachange?.(next);
		showNow(eraView(allEras.find((candidate) => candidate.code === next) as Era));
	}

	onDestroy(stopAnimation);
</script>

<svelte:window bind:innerHeight={viewportHeight} />

<div class="timeline">
	<EraStrip current={code} eras={allEras} onselect={openEra} {view} />

	<p class="era-name" aria-live="polite">{eraTitle(code)}</p>

	<div class="controls">
		<div class="move">
			{#if previous}
				<button
					class="quiet"
					aria-label={m.timeline.previous(eraTitle(previous))}
					onclick={() => openEra(previous)}
					type="button"
				>
					<Icon icon={ArrowLeft} size="sm" />
					{eraTitle(previous)}
				</button>
			{/if}
		</div>
		<div class="steps" aria-label={m.timeline.steps.label} role="group">
			<button
				class="quiet zoom"
				aria-label={m.timeline.zoomOut}
				disabled={steps.indexOf(step) <= 0}
				onclick={() => moveStep(-1)}
				type="button"
			>
				<Icon icon={Minus} size="sm" />
			</button>
			{#each steps as key (key)}
				<ToggleTag bind:pressed={() => key === step, (pressed) => pressed && chooseStep(key)}>
					{m.timeline.steps[key]}
				</ToggleTag>
			{/each}
			<button
				class="quiet zoom"
				aria-label={m.timeline.zoomIn}
				disabled={steps.indexOf(step) >= steps.length - 1}
				onclick={() => moveStep(1)}
				type="button"
			>
				<Icon icon={Plus} size="sm" />
			</button>
		</div>
		<div class="move next">
			{#if next}
				<button
					class="quiet"
					aria-label={m.timeline.next(eraTitle(next))}
					onclick={() => openEra(next)}
					type="button"
				>
					{eraTitle(next)}
					<Icon icon={ArrowRight} size="sm" />
				</button>
			{/if}
		</div>
	</div>

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

	<div bind:clientWidth={width}>
		<TimelineStage
			artworkLanes={orientation === 'horizontal' ? artworkLanes.length : 0}
			{era}
			eventLanes={showEvents ? lanes : 0}
			onbackground={() => (selected = null)}
			onkeypan={panShare}
			onpan={pan}
			onsettle={settle}
			onstep={moveStep}
			{orientation}
			{tint}
			{view}
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
						layoutSpan={target.span}
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
					layoutSpan={target.span}
					onselect={(artwork) => toggle('artwork', artwork.id)}
					selected={selected?.kind === 'artwork' ? selected.id : null}
				/>
			{/snippet}
		</TimelineStage>
	</div>

	{#if readingArtworks}
		<div class="reading-artworks">
			{#if nowArtworks.length > 0}
				<span class="caption label">{m.timeline.readingArtworks}</span>
				<ul class="titles">
					{#each nowArtworks.slice(0, READING_TITLES) as artwork (artwork.id)}
						<li>
							<button class="title" onclick={() => chooseArtwork(artwork)} type="button">
								<cite>{artwork.title}</cite>
							</button>
						</li>
					{/each}
				</ul>
				{#if nowArtworks.length > READING_TITLES}
					<span class="caption more"
						>{m.timeline.readingMore(nowArtworks.length - READING_TITLES)}</span
					>
				{/if}
			{:else}
				<span class="caption">{m.timeline.readingArtworksNone}</span>
			{/if}
		</div>
	{/if}

	{#if selectedEvent}
		{@const event = selectedEvent}
		<EventCard
			artworks={artworksOf(event)}
			{event}
			onartwork={chooseArtwork}
			ondelete={askToDelete}
			onwhole={() => showWhole(event)}
		/>
	{/if}
</div>

{#snippet deleteErrorAlert()}
	<Alert tone="danger">
		{deleteError}
	</Alert>
{/snippet}

{#if selectedEvent}
	<Dialog
		children={deleteError ? deleteErrorAlert : undefined}
		description={m.timeline.deleteConfirm.description}
		size="small"
		title={m.timeline.deleteConfirm.title(selectedEvent.name)}
		bind:open={deleteOpen}
	>
		{#snippet footer()}
			<Button onclick={() => (deleteOpen = false)}>
				{m.timeline.deleteConfirm.back}
			</Button>
			<Button disabled={deleting} onclick={remove} variant="primary">
				{deleting ? m.timeline.deleteConfirm.deleting : m.timeline.deleteConfirm.confirm}
			</Button>
		{/snippet}
	</Dialog>
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

	.reading-artworks {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-2);
		box-sizing: border-box;
		min-width: 0;
		height: calc(var(--line-height-md) + 2 * var(--spacing-2));
		margin: calc(-1 * var(--spacing-2));
		padding: var(--spacing-2);
		overflow: hidden;
		white-space: nowrap;
	}

	.label,
	.more {
		flex: none;
	}

	.titles {
		display: flex;
		gap: var(--spacing-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.titles li {
		min-width: 0;
	}

	.title {
		max-width: 100%;
		padding: 0;
		overflow: hidden;
		border: 0;
		background: none;
		color: var(--color-fg);
		font: inherit;
		text-overflow: ellipsis;
		cursor: pointer;
	}

	.title:hover cite {
		text-decoration: underline;
	}

	.controls {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: var(--spacing-2);
	}

	.steps {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-2);
	}

	.move {
		display: flex;
	}

	.move.next {
		justify-content: flex-end;
	}

	.quiet {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-1);
		border: 0;
		background: none;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		cursor: pointer;
	}

	.quiet:hover:not(:disabled) {
		color: var(--color-fg);
	}

	.quiet:disabled {
		opacity: 0.4;
		cursor: default;
	}

	@media (max-width: 767.98px) {
		.controls {
			grid-template-columns: 1fr 1fr;
		}

		.steps {
			grid-row: 2;
			grid-column: 1 / -1;
		}
	}
</style>
