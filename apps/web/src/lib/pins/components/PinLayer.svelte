<script lang="ts">
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { movePin } from '../pin-data.ts';
	import { fractionIn, pinsOfImage, type Fraction } from '../pin-layout.ts';
	import { MAX_PINS_PER_IMAGE, type Pin } from '../types.ts';
	import PinDialog from './PinDialog.svelte';
	import PinMarkers from './PinMarkers.svelte';

	type Props = {
		imageId: string;
		pins: Pin[];
		entries: readonly GlossaryEntry[];
		image?: ArtworkImageInput | null;
		onfailure: (message?: string) => void;
	};

	let { imageId, pins = $bindable(), entries, image, onfailure }: Props = $props();

	let shownWidth = $state(0);

	let draftSpot = $state<Fraction>();
	let dialogPin = $state<Pin>();
	let dialogOpen = $state(false);

	let imagePins = $derived(pinsOfImage(pins, imageId));
	let entryNames = $derived(Object.fromEntries(entries.map((entry) => [entry.id, entry.name])));

	function place(event: MouseEvent): void {
		onfailure();
		if (imagePins.length >= MAX_PINS_PER_IMAGE) {
			onfailure(m.pins.errors.tooMany(MAX_PINS_PER_IMAGE));
			return;
		}
		const layer = event.currentTarget as HTMLElement;
		draftSpot =
			event.detail === 0
				? { x: 0.5, y: 0.5 }
				: fractionIn(event.clientX, event.clientY, layer.getBoundingClientRect());
		dialogPin = undefined;
		dialogOpen = true;
	}

	function select(pin: Pin): void {
		onfailure();
		draftSpot = undefined;
		dialogPin = pin;
		dialogOpen = true;
	}

	async function moveTo(pin: Pin, spot: Fraction): Promise<void> {
		onfailure();
		pins = pins.map((item) => (item.id === pin.id ? { ...item, ...spot } : item));
		const { error } = await movePin(pin.id, spot.x, spot.y);
		if (!error) return;
		pins = pins.map((item) => (item.id === pin.id ? pin : item));
		onfailure(error);
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

<button
	class="place"
	aria-label={m.pins.placeHere}
	onclick={place}
	type="button"
	bind:clientWidth={shownWidth}
></button>
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
<PinDialog
	{entries}
	{image}
	{imageId}
	ondeleted={deleted}
	onsaved={saved}
	pin={dialogPin}
	shownWidth={shownWidth || undefined}
	spot={draftSpot ?? { x: 0.5, y: 0.5 }}
	bind:open={dialogOpen}
/>

<style>
	.place {
		position: absolute;
		inset: 0;
		padding: 0;
		border: none;
		background: transparent;
		cursor: crosshair;
	}
</style>
