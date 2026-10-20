<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { onDestroy, untrack } from 'svelte';
	import { Alert, Button, Dialog, Icon, ToggleTag } from '@study-atelier/ui';
	import { ERA_CODES, eraTitle } from '#lib/collection/eras.ts';
	import type { EraCode, WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { seenRange } from '../labels.ts';
	import {
		availableSteps,
		eraView,
		focusView,
		nextStep,
		panView,
		stepView,
		type StepKey
	} from '../scale.ts';
	import {
		activeAt,
		EVENT_LANES,
		EVENT_LANES_NARROW,
		eventsIn,
		lanesForEra
	} from '../event-lanes.ts';
	import { NARROW_WIDTH, orientationFor, verticalLength } from '../stage.ts';
	import { deleteTimelineEvent } from '../timeline-data.ts';
	import type { TimelineEvent } from '../types.ts';
	import { rememberEra } from '../start.ts';
	import { eraOf, eras, overlaps, spanOfYears, yearAt, type TimeSpan, type View } from '../time.ts';
	import ArtworkCard from './ArtworkCard.svelte';
	import EraStrip from './EraStrip.svelte';
	import EventCard from './EventCard.svelte';
	import TimelineEvents from './TimelineEvents.svelte';
	import TimelineArtworks from './TimelineArtworks.svelte';
	import TimelineStage from './TimelineStage.svelte';

	type Props = {
		initialEra: EraCode;
		initialFocus?: TimeSpan;
		artworks?: readonly WallArtwork[];
		events?: readonly TimelineEvent[];
		ondeleted?: (event: TimelineEvent) => void | Promise<void>;
	};

	type Selection = { kind: 'artwork' | 'event'; id: string } | null;

	let { initialEra, initialFocus, artworks = [], events = [], ondeleted }: Props = $props();

	const NOW_SHARE = 40;
	const LABEL_FONT = 14;

	const STEP_ANIMATION_MS = 400;
	const allEras = eras();

	const start = untrack(() =>
		initialFocus
			? focusView(eraOf(initialEra), initialFocus)
			: { step: 'era' as StepKey, view: eraView(eraOf(initialEra)) }
	);

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
	let measure: CanvasRenderingContext2D | null = null;
	let frame = 0;

	let era = $derived(eraOf(code));
	let steps = $derived(availableSteps(era));
	let index = $derived(ERA_CODES.indexOf(code));
	let previous = $derived(index > 0 ? ERA_CODES[index - 1] : undefined);
	let next = $derived(index < ERA_CODES.length - 1 ? ERA_CODES[index + 1] : undefined);
	let seen = $derived(seenRange(view, era));
	let collection = $derived(artworks);
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
	let selectedArtwork = $derived(
		selected?.kind === 'artwork'
			? artworks.find((artwork) => artwork.id === selected?.id)
			: undefined
	);
	let selectedEvent = $derived(
		selected?.kind === 'event' ? events.find((event) => event.id === selected?.id) : undefined
	);
	let tint = $derived(
		selectedEvent ? spanOfYears(selectedEvent.yearFrom, selectedEvent.yearTo) : undefined
	);
	let readingYear = $derived(yearAt(view.center));
	let now = $derived(
		activeAt(eraEvents, {
			start: view.center - view.span / NOW_SHARE,
			end: view.center + view.span / NOW_SHARE
		})
	);

	function labelWidth(event: TimelineEvent): number {
		if (!measure) {
			measure = document.createElement('canvas').getContext('2d');
			if (measure) {
				measure.font = `500 ${LABEL_FONT}px ${getComputedStyle(document.body).fontFamily}`;
			}
		}
		return measure ? measure.measureText(event.name).width + LABEL_FONT : event.name.length * 8;
	}

	function spanOf(item: { yearFrom: number | null; yearTo: number | null }): TimeSpan | undefined {
		return item.yearTo === null ? undefined : spanOfYears(item.yearFrom, item.yearTo);
	}

	function artworksOf(event: TimelineEvent): WallArtwork[] {
		const span = spanOfYears(event.yearFrom, event.yearTo);
		return artworks.filter((artwork) => {
			const other = spanOf(artwork);
			return other !== undefined && overlaps(other, span);
		});
	}

	function eventsOf(artwork: WallArtwork): TimelineEvent[] {
		const span = spanOf(artwork);
		return span ? activeAt(events, span) : [];
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

	function pan(by: number): void {
		showNow(panView(target, by, era));
	}

	function panShare(share: number): void {
		pan(share * target.span);
	}

	function openEra(next: EraCode): void {
		code = next;
		step = 'era';
		selected = null;
		rememberEra(next);
		showNow(eraView(eraOf(next)));
	}

	onDestroy(stopAnimation);
</script>

<svelte:window bind:innerHeight={viewportHeight} />

<div class="timeline">
	<header class="chapter">
		<div class="title">
			<h1>{eraTitle(code)}</h1>
			<span class="caption">{m.eras[code].years}</span>
		</div>
		<p class="seen">
			<span class="muted">{m.timeline.seen}</span>
			{seen}
			<span class="muted"
				>· {m.timeline.scale} {m.timeline.steps[step].toLocaleLowerCase('pl')}</span
			>
		</p>
	</header>

	<div class="eras" aria-label={m.timeline.eras} role="group">
		{#each ERA_CODES as candidate (candidate)}
			<ToggleTag
				bind:pressed={() => candidate === code, (pressed) => pressed && openEra(candidate)}
			>
				{eraTitle(candidate)}
			</ToggleTag>
		{/each}
	</div>

	<EraStrip current={code} eras={allEras} onselect={openEra} {view} />

	<div class="controls">
		<div class="steps" aria-label={m.timeline.steps.label} role="group">
			<span class="caption">{m.timeline.steps.label}</span>
			{#each steps as key (key)}
				<ToggleTag bind:pressed={() => key === step, (pressed) => pressed && chooseStep(key)}>
					{m.timeline.steps[key]}
				</ToggleTag>
			{/each}
		</div>
		<div class="moves">
			{#if previous}
				<Button
					aria-label={m.timeline.previous(eraTitle(previous))}
					onclick={() => openEra(previous)}
				>
					<Icon icon={ArrowLeft} size="sm" />
					{eraTitle(previous)}
				</Button>
			{/if}
			{#if next}
				<Button aria-label={m.timeline.next(eraTitle(next))} onclick={() => openEra(next)}>
					{eraTitle(next)}
					<Icon icon={ArrowRight} size="sm" />
				</Button>
			{/if}
			<Button aria-label={m.timeline.zoomOut} onclick={() => moveStep(-1)}>
				<Icon icon={Minus} size="sm" />
			</Button>
			<Button aria-label={m.timeline.zoomIn} onclick={() => moveStep(1)}>
				<Icon icon={Plus} size="sm" />
			</Button>
		</div>
	</div>

	<p class="now" aria-live="polite">
		{#if now.length > 0}
			{m.timeline.now(
				m.atelier.year(readingYear, false),
				now.map((event) => event.name).join(', ')
			)}
		{/if}
	</p>

	<div bind:clientWidth={width}>
		<TimelineStage
			{era}
			eventLanes={lanes}
			onkeypan={panShare}
			onpan={pan}
			onstep={moveStep}
			{orientation}
			{tint}
			{view}
		>
			{#snippet events(geometry)}
				<TimelineEvents
					{era}
					events={eraEvents}
					{geometry}
					{labelWidth}
					{lanes}
					onselect={(event) => toggle('event', event.id)}
					selected={selected?.kind === 'event' ? selected.id : null}
				/>
			{/snippet}
			{#snippet artworks(geometry)}
				<TimelineArtworks
					artworks={collection}
					{era}
					{geometry}
					onselect={(artwork) => toggle('artwork', artwork.id)}
					selected={selected?.kind === 'artwork' ? selected.id : null}
				/>
			{/snippet}
		</TimelineStage>
	</div>

	{#if selectedArtwork}
		<ArtworkCard
			artwork={selectedArtwork}
			events={eventsOf(selectedArtwork)}
			onevent={(event) => (selected = { kind: 'event', id: event.id })}
		/>
	{:else if selectedEvent}
		{@const event = selectedEvent}
		<EventCard
			artworks={artworksOf(event)}
			{event}
			onartwork={(artwork) => (selected = { kind: 'artwork', id: artwork.id })}
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
		gap: var(--spacing-4);
	}

	.chapter {
		display: grid;
		gap: var(--spacing-1);
	}

	.title {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-2) var(--spacing-4);
	}

	.seen,
	.now {
		font-variant-numeric: tabular-nums;
	}

	.now {
		min-height: var(--line-height-md);
		color: var(--color-fg-muted);
	}

	.muted {
		color: var(--color-fg-muted);
	}

	.eras,
	.steps,
	.moves {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-3) var(--spacing-6);
	}
</style>
