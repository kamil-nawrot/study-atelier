<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import { onDestroy, untrack, type Snippet } from 'svelte';
	import { Button, Icon, ToggleTag } from '@study-atelier/ui';
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
	import type { StageGeometry } from '../stage.ts';
	import { rememberEra } from '../start.ts';
	import { eraOf, eras, type TimeSpan, type View } from '../time.ts';
	import ArtworkCard from './ArtworkCard.svelte';
	import EraStrip from './EraStrip.svelte';
	import TimelineArtworks from './TimelineArtworks.svelte';
	import TimelineStage from './TimelineStage.svelte';

	type Props = {
		initialEra: EraCode;
		initialFocus?: TimeSpan;
		artworks?: readonly WallArtwork[];
		eventLanes?: number;
		events?: Snippet<[StageGeometry]>;
	};

	let { initialEra, initialFocus, artworks = [], eventLanes = 1, events }: Props = $props();

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
	let selected = $state<string | null>(null);
	let frame = 0;

	let era = $derived(eraOf(code));
	let steps = $derived(availableSteps(era));
	let index = $derived(ERA_CODES.indexOf(code));
	let previous = $derived(index > 0 ? ERA_CODES[index - 1] : undefined);
	let next = $derived(index < ERA_CODES.length - 1 ? ERA_CODES[index + 1] : undefined);
	let seen = $derived(seenRange(view, era));
	let allArtworks = $derived(artworks);
	let selectedArtwork = $derived(artworks.find((artwork) => artwork.id === selected));

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

	function openEra(next: EraCode): void {
		code = next;
		step = 'era';
		selected = null;
		rememberEra(next);
		showNow(eraView(eraOf(next)));
	}

	onDestroy(stopAnimation);
</script>

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

	<TimelineStage {era} {eventLanes} {events} onpan={pan} onstep={moveStep} {view}>
		{#snippet artworks(geometry)}
			<TimelineArtworks
				artworks={allArtworks}
				{era}
				{geometry}
				onselect={(artwork) => (selected = selected === artwork.id ? null : artwork.id)}
				{selected}
			/>
		{/snippet}
	</TimelineStage>

	{#if selectedArtwork}
		<ArtworkCard artwork={selectedArtwork} />
	{/if}
</div>

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

	.seen {
		font-variant-numeric: tabular-nums;
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
