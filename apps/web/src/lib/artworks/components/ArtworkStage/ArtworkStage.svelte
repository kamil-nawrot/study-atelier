<script lang="ts">
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import { untrack } from 'svelte';
	import { ArtworkImage, Button, Icon, NoImage } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import type { ResolvedPathname } from '$app/types';
	import FlipLinks from '#lib/artworks/components/FlipLinks/FlipLinks.svelte';
	import StageActions from '#lib/artworks/components/StageActions/StageActions.svelte';
	import StageGallery from '#lib/artworks/components/StageGallery/StageGallery.svelte';
	import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
	import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
	import {
		artworkImageCredit,
		artworkImageSource,
		artworkLargeSource,
		isTooLargeForLoupe
	} from '#lib/images/artwork-image/artwork-image.ts';
	import ImageViewer from '#lib/images/components/ImageViewer/ImageViewer.svelte';
	import Loupe from '#lib/images/components/Loupe/Loupe.svelte';
	import { LOUPE_MIN_RATIO } from '#lib/images/loupe/loupe.ts';
	import PinCard from '#lib/pins/components/PinCard/PinCard.svelte';
	import PinDialog from '#lib/pins/components/PinDialog/PinDialog.svelte';
	import PinMarkers from '#lib/pins/components/PinMarkers/PinMarkers.svelte';
	import { pinsOfImage } from '#lib/pins/pin-layout/pin-layout.ts';
	import type { Pin as PinRecord } from '#lib/pins/types/pin.ts';
	import { swipe } from '#lib/wall/flip/flip.ts';
	import type { FlipDirection } from '#lib/wall/types/flip-direction.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork: ArtworkRecord;
		editHref: string;
		glossary?: GlossaryEntry[];
		pins: PinRecord[];
		focusPin?: string;
		showPinsOnOpen: boolean;
		loupeOnOpen: boolean;
		flipLinks?: Record<FlipDirection, ResolvedPathname | null>;
		onflip?: (direction: FlipDirection) => void;
	};

	let {
		artwork,
		editHref,
		glossary,
		pins,
		focusPin,
		showPinsOnOpen,
		loupeOnOpen,
		flipLinks,
		onflip
	}: Props = $props();

	const STAGE_WIDTH = 960;
	const VIEWER_WIDTH = 1920;

	let viewer: ReturnType<typeof ImageViewer>;

	let shown = $state(0);
	let gallery = $derived(artwork.image ? [artwork.image, ...artwork.images] : []);
	let current = $derived(gallery[shown] ?? artwork.image);
	let image = $derived(artworkImageSource(current, STAGE_WIDTH));
	let fullImage = $derived(artworkImageSource(current, VIEWER_WIDTH));
	let credit = $derived(image ? artworkImageCredit(current) : undefined);
	let ratio = $derived(image?.width && image.height ? image.width / image.height : undefined);

	const mouse = new MediaQuery('(hover: hover) and (pointer: fine)');
	let frameWidth = $state(0);
	let loupeOn = $state(false);
	let large = $derived(artworkLargeSource(current));
	let loupeReady = $derived(
		large !== undefined && frameWidth > 0 && large.width >= LOUPE_MIN_RATIO * frameWidth
	);
	let loupeActive = $derived(loupeOn && loupeReady && mouse.current);

	let showPins = $state(false);

	let imageId = $derived(current?.id);
	let allPins = $derived(pins);
	let imagePins = $derived(pinsOfImage(allPins, imageId));
	let newPin = $state<{ x: number; y: number; viewWidth: number }>();
	let newPinOpen = $state(false);
	let entryNames = $derived(
		Object.fromEntries((glossary ?? []).map((entry) => [entry.id, entry.name]))
	);

	$effect.pre(() => {
		void artwork.id;
		const focused = pins.find((pin) => pin.id === focusPin);
		const focusedImage = focused ? gallery.findIndex((item) => item?.id === focused.imageId) : -1;
		shown = Math.max(focusedImage, 0);
		showPins = focusedImage >= 0 || untrack(() => showPinsOnOpen);
	});

	$effect.pre(() => {
		void artwork.id;
		void shown;
		loupeOn = untrack(() => loupeOnOpen);
	});

	function step(by: -1 | 1): void {
		shown = (shown + by + gallery.length) % gallery.length;
	}

	let alt = $derived(
		`${artwork.title}, ${artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor}`
	);

	function toggleLoupe(): void {
		if (loupeReady) loupeOn = !loupeOn;
	}

	function pickView(spot: { x: number; y: number; viewWidth: number }): void {
		newPin = spot;
		newPinOpen = true;
	}

	function pinSaved(pin: PinRecord): void {
		allPins = [...allPins, pin];
		showPins = true;
	}
</script>

<figure
	style:--image-ratio={ratio}
	class="stage"
	class:dimmed={image !== undefined}
	class:flipping={flipLinks !== undefined}
	class:sized={ratio !== undefined}
	class:with-gallery={image !== undefined && gallery.length > 1}
	{@attach swipe((direction) => onflip?.(direction))}
>
	{#if flipLinks}
		<FlipLinks links={flipLinks} />
	{/if}
	{#if image}
		<img class="backdrop" alt="" aria-hidden="true" src={image.src} />
		<div class="mat">
			<div class="frame" bind:clientWidth={frameWidth}>
				<button
					class="open"
					aria-label={m.artworkView.openImage}
					onclick={() => viewer.open()}
					type="button"
				>
					<ArtworkImage
						{alt}
						height={image.height}
						sizes="(min-width: 768px) 60vw, 100vw"
						src={image.src}
						srcset={image.srcset}
						width={image.width}
					/>
				</button>
				{#if showPins}
					<PinMarkers card={pinCard} names={entryNames} pins={imagePins} />
				{/if}
				{#if loupeActive && large}
					<Loupe
						image={image.src}
						large={large.src}
						onclose={() => (loupeOn = false)}
						onpick={pickView}
						sourceWidth={large.width}
					/>
				{/if}
			</div>
		</div>
		{#if credit}
			<figcaption class="caption">{credit}</figcaption>
		{/if}
		{#if mouse.current || imagePins.length > 0}
			<StageActions
				{loupeActive}
				{loupeReady}
				mouse={mouse.current}
				onloupe={toggleLoupe}
				pinCount={imagePins.length}
				tooLarge={isTooLargeForLoupe(current)}
				bind:showPins
			/>
		{/if}
		{#if gallery.length > 1}
			<StageGallery {gallery} bind:shown />
		{/if}
	{:else}
		<span class="mat">
			<span class="window">
				<NoImage />
			</span>
		</span>
		<div>
			<Button href={editHref}>
				<Icon icon={ImagePlus} size="sm" />
				{m.artworkView.addImage}
			</Button>
		</div>
	{/if}
</figure>

{#if imageId !== undefined && newPin}
	<PinDialog
		entries={glossary ?? []}
		image={current}
		{imageId}
		ondeleted={() => {}}
		onsaved={pinSaved}
		shownWidth={frameWidth}
		spot={newPin}
		view={newPin.viewWidth}
		bind:open={newPinOpen}
	/>
{/if}
{#snippet pinCard(pin: PinRecord)}
	<PinCard
		entry={glossary?.find((entry) => entry.id === pin.glossaryEntryId)}
		image={current}
		{pin}
		shownWidth={frameWidth}
	/>
{/snippet}

<ImageViewer bind:this={viewer} {alt} count={gallery.length} image={fullImage} onstep={step} />

<style>
	.stage {
		--size-gallery-thumb: 56px;

		position: relative;
		display: grid;
		justify-items: center;
		align-content: center;
		gap: var(--spacing-3);
		padding: var(--spacing-6) var(--spacing-4);
		overflow: hidden;
		background: var(--color-stage-bg);
		color: var(--color-stage-fg-muted);
	}

	.dimmed::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--color-scrim);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(32px);
		scale: 1.2;
	}

	.stage > :not(.backdrop) {
		position: relative;
		z-index: 1;
	}

	.stage.flipping {
		padding-inline: var(--spacing-8);
		touch-action: pan-y pinch-zoom;
	}

	.open {
		display: block;
		max-width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: var(--cursor-zoom-in);
	}

	.mat {
		display: block;
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.frame {
		position: relative;
	}

	.mat :global(img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 60dvh;
		background: var(--color-mat-window);
	}

	.window {
		display: grid;
		width: min(320px, calc(100vw - 2 * var(--spacing-6)));
		aspect-ratio: 4 / 5;
	}

	.stage.with-gallery {
		padding-bottom: calc(var(--size-gallery-thumb) + 2 * var(--spacing-6));
	}

	.stage .caption {
		color: var(--color-stage-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	@media (max-width: 767.98px) {
		.stage {
			--caption-height: calc(2 * var(--font-size-xs) * var(--line-height-xs) + var(--spacing-3));
			--image-max-height: calc(100cqh - 2 * var(--spacing-2) - var(--caption-height));

			container-type: size;
			height: calc(
				var(--artwork-max-height) - var(--spacing-6) - var(--heading-height) - var(--spacing-8)
			);
		}

		.mat :global(img) {
			max-width: calc(100cqw - 2 * var(--spacing-2));
			max-height: var(--image-max-height);
		}

		.sized .mat :global(img) {
			width: min(
				calc(100cqw - 2 * var(--spacing-2)),
				calc(var(--image-max-height) * var(--image-ratio))
			);
		}

		.window {
			width: auto;
			height: min(
				400px,
				calc(100cqh - var(--size-control) - var(--spacing-3) - 2 * var(--spacing-2))
			);
		}
	}

	@media (min-width: 768px) {
		.stage {
			container-type: size;
			padding: var(--spacing-6);
		}

		.stage.flipping {
			padding-inline: var(--spacing-12);
		}

		.mat {
			padding: var(--spacing-4) var(--spacing-4) var(--spacing-6);
		}

		.mat :global(img) {
			max-width: calc(100cqw - 2 * var(--spacing-4));
			max-height: calc(100cqh - var(--spacing-12) - var(--spacing-8));
		}

		.window {
			width: auto;
			height: calc(100cqh - var(--spacing-24) - var(--spacing-12));
		}
	}
</style>
