<script lang="ts">
	import { Alert, ArtworkImage, Button, Dialog } from '@study-atelier/ui';
	import type { ArtworkImageSource } from '#lib/collection/artwork-image.ts';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { movePin } from '../pin-data.ts';
	import { fractionIn, pinsOfImage, type Fraction } from '../pin-layout.ts';
	import { MAX_PINS_PER_IMAGE, type Pin } from '../types.ts';
	import PinDialog from './PinDialog.svelte';
	import PinMarkers from './PinMarkers.svelte';

	type Props = {
		open?: boolean;
		alt: string;
		source?: ArtworkImageSource;
		imageId: string;
		pins: Pin[];
		entries: readonly GlossaryEntry[];
	};

	let {
		open = $bindable(false),
		alt,
		source,
		imageId,
		pins = $bindable(),
		entries
	}: Props = $props();

	let failure = $state<string>();
	let draftSpot = $state<Fraction>();
	let dialogPin = $state<Pin>();
	let dialogOpen = $state(false);

	let imagePins = $derived(pinsOfImage(pins, imageId));
	let entryNames = $derived(Object.fromEntries(entries.map((entry) => [entry.id, entry.name])));

	$effect(() => {
		if (open) failure = undefined;
	});

	function place(event: MouseEvent): void {
		failure = undefined;
		if (imagePins.length >= MAX_PINS_PER_IMAGE) {
			failure = m.pins.errors.tooMany(MAX_PINS_PER_IMAGE);
			return;
		}
		const frame = event.currentTarget as HTMLElement;
		draftSpot =
			event.detail === 0
				? { x: 0.5, y: 0.5 }
				: fractionIn(event.clientX, event.clientY, frame.getBoundingClientRect());
		dialogPin = undefined;
		dialogOpen = true;
	}

	function select(pin: Pin): void {
		failure = undefined;
		draftSpot = undefined;
		dialogPin = pin;
		dialogOpen = true;
	}

	async function moveTo(pin: Pin, spot: Fraction): Promise<void> {
		failure = undefined;
		pins = pins.map((item) => (item.id === pin.id ? { ...item, ...spot } : item));
		const { error } = await movePin(pin.id, spot.x, spot.y);
		if (!error) return;
		pins = pins.map((item) => (item.id === pin.id ? pin : item));
		failure = error;
	}

	function saved(pin: Pin): void {
		pins = pins.some((item) => item.id === pin.id)
			? pins.map((item) => (item.id === pin.id ? pin : item))
			: [...pins, pin];
	}

	function deleted(pin: Pin): void {
		pins = pins.filter((item) => item.id !== pin.id);
	}
</script>

<Dialog description={m.pins.editHint} title={m.pins.editorTitle} bind:open>
	<div class="editor">
		{#if failure}
			<Alert tone="danger">{failure}</Alert>
		{/if}
		{#if source}
			<div class="frame">
				<button class="place" aria-label={m.pins.placeHere} onclick={place} type="button">
					<ArtworkImage
						{alt}
						height={source.height}
						sizes="(min-width: 768px) 60vw, 100vw"
						src={source.src}
						srcset={source.srcset}
						width={source.width}
					/>
				</button>
				<PinMarkers
					draft={draftSpot && dialogOpen && !dialogPin
						? { ...draftSpot, number: imagePins.length + 1 }
						: undefined}
					editing
					names={entryNames}
					onmove={moveTo}
					onselect={select}
					pins={imagePins}
				/>
			</div>
		{/if}
		<p class="note">{m.pins.editorNote}</p>
	</div>
	{#snippet footer()}
		<Button onclick={() => (open = false)} variant="primary">{m.pins.done}</Button>
	{/snippet}
</Dialog>

<PinDialog
	{entries}
	{imageId}
	ondeleted={deleted}
	onsaved={saved}
	pin={dialogPin}
	spot={draftSpot ?? { x: 0.5, y: 0.5 }}
	bind:open={dialogOpen}
/>

<style>
	.editor {
		display: grid;
		justify-items: center;
		gap: var(--spacing-4);
	}

	.frame {
		position: relative;
		max-width: 100%;
	}

	.place {
		display: block;
		max-width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: crosshair;
	}

	.frame :global(img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 60dvh;
		background: var(--color-mat-window);
	}

	.note {
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
