<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Pin from '@lucide/svelte/icons/pin';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import type { LucideIcon } from '@lucide/svelte';
	import {
		ArtworkImage,
		Button,
		Icon,
		NoImage,
		type NoteLinks,
		Popover,
		Tag,
		Tooltip,
		overlayScrollbar
	} from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import type { ResolvedPathname } from '$app/types';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import PinCard from '#lib/pins/components/PinCard.svelte';
	import PinDialog from '#lib/pins/components/PinDialog.svelte';
	import PinMarkers from '#lib/pins/components/PinMarkers.svelte';
	import { pinsOfImage } from '#lib/pins/pin-layout.ts';
	import type { Pin as PinRecord } from '#lib/pins/types.ts';
	import { LOUPE_MIN_RATIO } from '../loupe.ts';
	import {
		artworkImageCredit,
		artworkImageSource,
		artworkLargeSource,
		isTooLargeForLoupe
	} from '../artwork-image.ts';
	import { artworkTypeIcon } from '../artwork-types.ts';
	import { eraIcon } from '../eras.ts';
	import { formatDate, formatRecordNumber, signedYear } from '../format.ts';
	import { artworkPanelOpen, rememberArtworkPanel } from '../artwork-panel.ts';
	import { FLIP_DIRECTIONS, swipe } from '../flip.ts';
	import type { Mention } from '../mentions.ts';
	import type { ArtworkRecord, FlipDirection, OwnFieldDefinition, ValueKind } from '../types.ts';
	import { valueKindName } from '../value-pages.ts';
	import {
		emptyValueSummaries,
		summaryKey,
		type ValueSummaries,
		type ValueSummary
	} from '../value-summaries.ts';
	import ImageViewer from './ImageViewer.svelte';
	import Loupe from './Loupe.svelte';
	import MentionedIn from './MentionedIn.svelte';
	import ValueSummaryCard from './ValueSummaryCard.svelte';

	type Props = {
		artwork: ArtworkRecord;
		editHref: string;
		noteLinks?: NoteLinks;
		glossary?: GlossaryEntry[];
		pins?: PinRecord[];
		focusPin?: string;
		mentions?: Mention[];
		summaries?: ValueSummaries;
		ownFields?: OwnFieldDefinition[];
		flipLinks?: Record<FlipDirection, ResolvedPathname | null>;
		onflip?: (direction: FlipDirection) => void;
	};

	let {
		artwork,
		editHref,
		flipLinks,
		noteLinks,
		glossary,
		pins = [],
		focusPin,
		mentions = [],
		summaries = emptyValueSummaries(),
		ownFields = [],
		onflip
	}: Props = $props();

	const STAGE_WIDTH = 960;
	const VIEWER_WIDTH = 1920;
	const GALLERY_WIDTH = 120;

	let panelOpen = $state(artworkPanelOpen());
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
		showPins = focusedImage >= 0;
	});

	$effect.pre(() => {
		void artwork.id;
		void shown;
		loupeOn = false;
	});

	function step(by: -1 | 1): void {
		shown = (shown + by + gallery.length) % gallery.length;
	}
	let authors = $derived(
		artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor
	);
	let date = $derived(
		formatDate(
			signedYear(artwork.yearFrom, artwork.fromBeforeCommonEra),
			signedYear(artwork.yearTo, artwork.toBeforeCommonEra),
			artwork.yearApproximate
		)
	);

	type ViewField = {
		label: string;
		values: string[];
		tags: boolean;
		kind?: ValueKind;
		icon?: LucideIcon;
	};

	let alt = $derived(`${artwork.title}, ${authors}`);
	let fields = $derived<ViewField[]>([
		{
			label: m.artworkForm.type,
			values: artwork.typeCode ? [m.artworkTypes[artwork.typeCode]] : [],
			tags: false,
			icon: artwork.typeCode ? artworkTypeIcon(artwork.typeCode) : undefined
		},
		{
			label: m.artworkForm.era,
			values: artwork.eraCode ? [m.eras[artwork.eraCode].name] : [],
			tags: false,
			kind: 'era',
			icon: artwork.eraCode ? eraIcon(artwork.eraCode) : undefined
		},
		{
			label: m.artworkForm.period,
			values: artwork.period ? [artwork.period] : [],
			tags: true,
			kind: 'period'
		},
		{ label: m.artworkForm.style, values: artwork.styles, tags: true, kind: 'style' },
		{ label: m.artworkForm.material, values: artwork.materials, tags: true, kind: 'material' },
		{
			label: m.artworkForm.location,
			values: artwork.location ? [artwork.location] : [],
			tags: true,
			kind: 'location'
		},
		...ownFields.flatMap((field) => {
			const entry = artwork.own?.[field.id];
			if (Array.isArray(entry)) {
				return entry.length > 0 ? [{ label: field.name, values: entry, tags: true }] : [];
			}
			const text = entry === true ? m.ownFields.ticked : (entry || '').trim();
			return text ? [{ label: field.name, values: [text], tags: false }] : [];
		})
	]);

	function summaryOf(kind: ValueKind, name: string): ValueSummary | undefined {
		if (kind === 'era') return artwork.eraCode ? summaries.eras[artwork.eraCode] : undefined;
		return summaries.values[summaryKey(kind, name)];
	}

	function parentOf(kind: ValueKind): string | undefined {
		if (kind === 'period' && artwork.eraCode) return m.eras[artwork.eraCode].name;
		if (kind === 'style' && artwork.period) return artwork.period;
		return undefined;
	}

	function setPanel(open: boolean): void {
		panelOpen = open;
		rememberArtworkPanel(open);
	}

	function openViewer(): void {
		viewer.open();
	}

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

{#snippet valueName(kind: ValueKind, name: string)}
	{@const summary = summaryOf(kind, name)}
	{#if summary}
		<Popover>
			{name}
			{#snippet content()}
				<ValueSummaryCard {name} kind={valueKindName(kind)} parent={parentOf(kind)} {summary} />
			{/snippet}
		</Popover>
	{:else}
		{name}
	{/if}
{/snippet}

{#snippet valueTag(kind: ValueKind | undefined, name: string)}
	{@const summary = kind ? summaryOf(kind, name) : undefined}
	{@const label =
		kind === 'location' && summaries.countries[name]
			? `${name}, ${summaries.countries[name]}`
			: name}
	{#if kind && summary}
		<Popover>
			<Tag>{label}</Tag>
			{#snippet content()}
				<ValueSummaryCard {name} kind={valueKindName(kind)} parent={parentOf(kind)} {summary} />
			{/snippet}
		</Popover>
	{:else}
		<Tag>{label}</Tag>
	{/if}
{/snippet}

{#snippet empty()}
	<span class="empty">
		<span aria-hidden="true">—</span>
		<span class="visually-hidden">{m.artworkView.empty}</span>
	</span>
{/snippet}

<div class="view" class:closed={!panelOpen}>
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
			{#each FLIP_DIRECTIONS as direction (direction)}
				{@const href = flipLinks[direction]}
				{@const icon = direction === 'previous' ? ChevronLeft : ChevronRight}
				{#if href}
					<a
						class="flip {direction}"
						aria-label={m.artworkView[direction]}
						data-sveltekit-replacestate
						data-sveltekit-reset="false"
						{href}
					>
						<Icon {icon} />
					</a>
				{:else}
					<span class="flip {direction} end" aria-hidden="true">
						<Icon {icon} />
					</span>
				{/if}
			{/each}
		{/if}
		{#if image}
			<img class="backdrop" alt="" aria-hidden="true" src={image.src} />
			<div class="mat">
				<div class="frame" bind:clientWidth={frameWidth}>
					<button
						class="open"
						aria-label={m.artworkView.openImage}
						onclick={openViewer}
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
				<div class="stage-actions">
					{#if mouse.current}
						<Tooltip
							align="end"
							placement="bottom"
							text={loupeReady
								? m.loupe.label
								: isTooLargeForLoupe(current)
									? m.loupe.tooLarge
									: m.loupe.unavailable}
						>
							{#snippet children(id)}
								<button
									class="stage-action"
									class:active={loupeActive}
									class:unavailable={!loupeReady}
									aria-describedby={id}
									aria-disabled={!loupeReady}
									aria-label={m.loupe.label}
									aria-pressed={loupeReady ? loupeActive : undefined}
									onclick={toggleLoupe}
									type="button"
								>
									<Icon icon={Search} size="sm" />
								</button>
							{/snippet}
						</Tooltip>
					{/if}
					{#if imagePins.length > 0}
						<button
							class="stage-action"
							class:active={showPins}
							aria-label={m.pins.switchLabel(imagePins.length)}
							aria-pressed={showPins}
							onclick={() => (showPins = !showPins)}
							title={m.pins.switchLabel(imagePins.length)}
							type="button"
						>
							<Icon icon={Pin} size="sm" />
							<span>{imagePins.length}</span>
						</button>
					{/if}
				</div>
			{/if}
			{#if gallery.length > 1}
				<div class="gallery">
					{#each gallery as item, index (index)}
						{@const thumb = artworkImageSource(item, GALLERY_WIDTH)}
						<button
							class="thumb"
							class:shown={index === shown}
							aria-label={m.artworkForm.imageSlot(index + 1, gallery.length)}
							aria-pressed={index === shown}
							onclick={() => (shown = index)}
							type="button"
						>
							{#if thumb}
								<img alt="" src={thumb.src} />
							{/if}
						</button>
					{/each}
				</div>
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

	<div class="side">
		<aside class="panel" {@attach overlayScrollbar()} aria-label={m.artworkView.information}>
			<div class="panel-top">
				<span class="caption">{m.artworkView.information}</span>
				<button
					class="icon-button"
					aria-label={m.artworkView.hideInformation}
					onclick={() => setPanel(false)}
					type="button"
				>
					<Icon icon={X} />
				</button>
			</div>

			<header class="heading">
				<span class="number">{formatRecordNumber(artwork.number)}</span>
				<h1><cite class="artwork-title">{artwork.title}</cite></h1>
				<p class="meta">
					<span>
						{#if artwork.authors.length === 0}
							{authors}
						{:else}
							{#each artwork.authors as author, index (author)}
								{index > 0 ? ', ' : ''}{@render valueName('author', author)}
							{/each}
						{/if}
					</span>
					{#if date}
						<span aria-hidden="true">·</span>
						<span class="date">{date}</span>
					{/if}
				</p>
			</header>

			<dl>
				{#each fields as field (field.label)}
					<dt class="caption">{field.label}</dt>
					<dd>
						{#if field.values.length === 0}
							{@render empty()}
						{:else if field.tags}
							{#each field.values as value (value)}
								{@render valueTag(field.kind, value)}
							{/each}
						{:else}
							{#if field.icon}
								<Icon icon={field.icon} size="sm" />
							{/if}
							{#each field.values as value (value)}
								{#if field.kind}
									{@render valueName(field.kind, value)}
								{:else}
									{value}
								{/if}
							{/each}
						{/if}
					</dd>
				{/each}
			</dl>

			<section class="notes" aria-labelledby="artwork-notes">
				<h2 id="artwork-notes" class="caption">{m.artworkForm.notes}</h2>
				{#if artwork.notes.trim()}
					<GlossaryNotes entries={glossary} links={noteLinks} value={artwork.notes} />
				{:else}
					{@render empty()}
				{/if}
			</section>

			<MentionedIn {mentions} />
		</aside>

		<div class="strip">
			<button
				class="icon-button"
				aria-expanded="false"
				aria-label={m.artworkView.showInformation}
				onclick={() => setPanel(true)}
				type="button"
			>
				<Icon icon={ChevronLeft} />
				<span class="strip-label">{m.artworkView.information}</span>
			</button>
		</div>
	</div>
</div>

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
	.view {
		display: grid;
	}

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

	.stage > .flip {
		position: absolute;
		top: 50%;
		z-index: 2;
		display: flex;
		padding: var(--spacing-3) var(--spacing-1);
		color: var(--color-stage-fg);
		opacity: 0.6;
		translate: 0 -50%;
	}

	.stage > .previous {
		left: 0;
	}

	.stage > .next {
		right: 0;
	}

	.stage > a.flip:hover,
	.stage > a.flip:focus-visible {
		opacity: 1;
	}

	.stage > .end {
		opacity: 0.2;
	}

	.open {
		display: block;
		max-width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: var(--cursor-zoom-in);
	}

	.stage > .stage-actions {
		position: absolute;
		top: var(--spacing-2);
		right: var(--spacing-2);
		z-index: 3;
		display: flex;
		align-items: center;
	}

	.stage-action {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-stage-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		cursor: pointer;
		opacity: 0.6;
	}

	.stage-action:hover,
	.stage-action:focus-visible,
	.stage-action.active {
		opacity: 1;
	}

	.stage-action.unavailable {
		cursor: default;
		opacity: 0.2;
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

	.stage > .gallery {
		position: absolute;
		right: 0;
		bottom: var(--spacing-6);
		left: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--spacing-2);
	}

	.thumb {
		width: var(--size-gallery-thumb);
		height: var(--size-gallery-thumb);
		padding: 0;
		overflow: hidden;
		border: var(--border-width-base) solid var(--color-stage-fg-muted);
		background: transparent;
		cursor: pointer;
		opacity: 0.6;
	}

	.thumb.shown {
		border-color: var(--color-stage-fg);
		opacity: 1;
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.stage .caption {
		color: var(--color-stage-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.panel {
		display: grid;
		align-content: start;
		gap: var(--spacing-8);
		padding: var(--spacing-6) var(--spacing-4) var(--spacing-12);
	}

	.panel-top,
	.strip {
		display: none;
	}

	.icon-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.heading {
		display: grid;
		gap: var(--spacing-2);
	}

	.number {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		font-variant-numeric: tabular-nums;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		column-gap: var(--spacing-1);
	}

	.date {
		white-space: nowrap;
	}

	dl {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--spacing-3) var(--spacing-4);
	}

	dt,
	dd {
		min-height: calc(var(--font-size-sm) * var(--line-height-xs) + 2 * var(--spacing-1));
	}

	dt {
		display: flex;
		align-items: center;
	}

	dd {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.notes {
		display: grid;
		gap: var(--spacing-2);
	}

	.notes h2 {
		font-weight: var(--font-weight-regular);
	}

	.empty {
		color: var(--color-fg-muted);
	}

	@media (max-width: 767.98px) {
		.view {
			--heading-height: calc(
				var(--font-size-xs) * var(--line-height-xs) + 2 * var(--spacing-2) + 2 *
					var(--font-size-xl) * var(--line-height-xl) + var(--font-size-md) * var(--line-height-md)
			);
		}

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

		.heading {
			align-content: start;
			min-height: var(--heading-height);
		}
	}

	@media (min-width: 768px) {
		.view {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-rows: minmax(0, 1fr);
			height: 100%;
			min-height: 0;
		}

		.stage {
			container-type: size;
			padding: var(--spacing-6);
		}

		.stage.flipping {
			padding-inline: var(--spacing-12);
		}

		.stage > .flip {
			padding: var(--spacing-3);
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

		.side {
			position: relative;
			box-sizing: content-box;
			width: 380px;
			overflow: hidden;
			border-left: var(--border-width-hairline) solid var(--color-tag);
		}

		.closed .side {
			width: 48px;
		}

		.panel {
			width: 380px;
			height: 100%;
			overflow-y: auto;
			padding: var(--spacing-8) var(--spacing-6) var(--spacing-12);
		}

		.panel-top {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-right: calc(-1 * var(--spacing-2));
		}

		.closed .panel {
			visibility: hidden;
		}

		.strip {
			position: absolute;
			inset: 0 auto 0 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 48px;
			padding: var(--spacing-8) 0 var(--spacing-4);
			background: var(--color-bg);
			visibility: hidden;
			opacity: 0;
		}

		.closed .strip {
			visibility: visible;
			opacity: 1;
		}

		.strip .icon-button {
			flex-direction: column;
			gap: var(--spacing-3);
		}

		.strip-label {
			writing-mode: vertical-rl;
			font-size: var(--font-size-sm);
			font-weight: var(--font-weight-medium);
			line-height: var(--line-height-sm);
		}
	}

	@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
		.side {
			transition: width var(--duration-short) ease-out;
		}

		.panel,
		.strip {
			transition:
				visibility var(--duration-short),
				opacity var(--duration-short) ease-out;
		}
	}
</style>
