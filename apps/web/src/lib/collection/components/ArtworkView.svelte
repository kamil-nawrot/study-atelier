<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import X from '@lucide/svelte/icons/x';
	import type { LucideIcon } from '@lucide/svelte';
	import {
		ArtworkImage,
		Button,
		Icon,
		NoImage,
		type NoteLinks,
		Popover,
		Tag
	} from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import GlossaryNotes from '#lib/glossary/components/GlossaryNotes.svelte';
	import type { GlossaryEntry } from '#lib/glossary/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { artworkImageCredit, artworkImageSource } from '../artwork-image.ts';
	import { artworkTypeIcon } from '../artwork-types.ts';
	import { eraIcon } from '../eras.ts';
	import { formatDate, formatRecordNumber, signedYear } from '../format.ts';
	import { artworkPanelOpen, rememberArtworkPanel } from '../artwork-panel.ts';
	import { FLIP_DIRECTIONS, swipe } from '../flip.ts';
	import type { Mention } from '../mentions.ts';
	import type { ArtworkRecord, FlipDirection, ValueKind } from '../types.ts';
	import { valueKindName } from '../value-pages.ts';
	import {
		emptyValueSummaries,
		summaryKey,
		type ValueSummaries,
		type ValueSummary
	} from '../value-summaries.ts';
	import ImageViewer from './ImageViewer.svelte';
	import MentionedIn from './MentionedIn.svelte';
	import ValueSummaryCard from './ValueSummaryCard.svelte';

	type Props = {
		artwork: ArtworkRecord;
		editHref: string;
		noteLinks?: NoteLinks;
		glossary?: GlossaryEntry[];
		mentions?: Mention[];
		summaries?: ValueSummaries;
		flipLinks?: Record<FlipDirection, ResolvedPathname | null>;
		onflip?: (direction: FlipDirection) => void;
	};

	let {
		artwork,
		editHref,
		flipLinks,
		noteLinks,
		glossary,
		mentions = [],
		summaries = emptyValueSummaries(),
		onflip
	}: Props = $props();

	const STAGE_WIDTH = 960;
	const VIEWER_WIDTH = 1920;

	let panelOpen = $state(artworkPanelOpen());
	let viewer: ReturnType<typeof ImageViewer>;

	let image = $derived(artworkImageSource(artwork.image, STAGE_WIDTH));
	let fullImage = $derived(artworkImageSource(artwork.image, VIEWER_WIDTH));
	let credit = $derived(image ? artworkImageCredit(artwork.image) : undefined);
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
	let alt = $derived(`${artwork.title}, ${authors}`);
	let fields = $derived([
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
		}
	] satisfies {
		label: string;
		values: string[];
		tags: boolean;
		kind?: ValueKind;
		icon?: LucideIcon;
	}[]);

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
		<span class="hidden">{m.artworkView.empty}</span>
	</span>
{/snippet}

<div class="view" class:closed={!panelOpen}>
	<figure
		class="stage"
		class:dimmed={image !== undefined}
		class:flipping={flipLinks !== undefined}
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
			<button class="open" aria-label={m.artworkView.openImage} onclick={openViewer} type="button">
				<span class="mat">
					<ArtworkImage
						{alt}
						height={image.height}
						sizes="(min-width: 768px) 60vw, 100vw"
						src={image.src}
						srcset={image.srcset}
						width={image.width}
					/>
				</span>
			</button>
			{#if credit}
				<figcaption class="caption">{credit}</figcaption>
			{/if}
		{:else}
			<span class="mat">
				<span class="window">
					<NoImage label={m.ui.noImage} />
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
		<aside class="panel" aria-label={m.artworkView.information}>
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

<ImageViewer bind:this={viewer} {alt} image={fullImage} />

<style>
	.view {
		display: grid;
	}

	.stage {
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
		cursor: zoom-in;
	}

	.mat {
		display: block;
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
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

	.hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
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
