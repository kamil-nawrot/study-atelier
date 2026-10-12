<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import X from '@lucide/svelte/icons/x';
	import { ArtworkImage, Button, Icon, Notes, Tag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { artworkImageCredit, artworkImageSource } from '../artwork-image.ts';
	import { formatRecordNumber, formatYear } from '../format.ts';
	import { artworkPanelOpen, rememberArtworkPanel } from '../artwork-panel.ts';
	import type { ArtworkRecord } from '../types.ts';

	type Props = {
		artwork: ArtworkRecord;
		editHref: string;
	};

	let { artwork, editHref }: Props = $props();

	const STAGE_WIDTH = 960;
	const VIEWER_WIDTH = 1920;

	let panelOpen = $state(artworkPanelOpen());
	let viewer: HTMLDialogElement;
	let viewerUsed = $state(false);

	let image = $derived(artworkImageSource(artwork.image, STAGE_WIDTH));
	let fullImage = $derived(artworkImageSource(artwork.image, VIEWER_WIDTH));
	let credit = $derived(image ? artworkImageCredit(artwork.image) : undefined);
	let authors = $derived(
		artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor
	);
	let date = $derived(
		formatYear(
			artwork.year === null || !artwork.beforeCommonEra ? artwork.year : -artwork.year,
			artwork.yearApproximate
		)
	);
	let alt = $derived(`${artwork.title}, ${authors}`);
	let fields = $derived([
		{
			label: m.artworkForm.type,
			values: artwork.typeCode ? [m.artworkTypes[artwork.typeCode]] : [],
			tags: false
		},
		{ label: m.artworkForm.period, values: artwork.periods, tags: true },
		{ label: m.artworkForm.style, values: artwork.styles, tags: true },
		{ label: m.artworkForm.material, values: artwork.materials, tags: true },
		{
			label: m.artworkForm.location,
			values: artwork.location ? [artwork.location] : [],
			tags: true
		}
	]);

	function setPanel(open: boolean): void {
		panelOpen = open;
		rememberArtworkPanel(open);
	}

	function openViewer(): void {
		viewerUsed = true;
		viewer.showModal();
	}
</script>

{#snippet empty()}
	<span class="empty">
		<span aria-hidden="true">—</span>
		<span class="hidden">{m.artworkView.empty}</span>
	</span>
{/snippet}

<div class="view" class:closed={!panelOpen}>
	<figure class="stage" class:dimmed={image !== undefined}>
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
				<span class="window" aria-label={m.ui.noImage} role="img">
					<Icon icon={ImageIcon} />
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
					<span>{authors}</span>
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
								<Tag>{value}</Tag>
							{/each}
						{:else}
							{field.values.join(', ')}
						{/if}
					</dd>
				{/each}
			</dl>

			<section class="notes" aria-labelledby="artwork-notes">
				<h2 id="artwork-notes" class="caption">{m.artworkForm.notes}</h2>
				{#if artwork.notes.trim()}
					<Notes value={artwork.notes} />
				{:else}
					{@render empty()}
				{/if}
			</section>
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

<dialog bind:this={viewer} class="viewer" aria-label={alt}>
	{#if viewerUsed && fullImage}
		<ArtworkImage
			{alt}
			height={fullImage.height}
			sizes="100vw"
			src={fullImage.src}
			srcset={fullImage.srcset}
			surface="stage"
			width={fullImage.width}
		/>
	{/if}
	<button
		class="icon-button close"
		aria-label={m.artworkView.closeImage}
		onclick={() => viewer.close()}
		type="button"
	>
		<Icon icon={X} />
	</button>
</dialog>

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
		place-items: center;
		width: min(320px, calc(100vw - 2 * var(--spacing-6)));
		aspect-ratio: 4 / 5;
		background: var(--color-mat-window);
		color: var(--color-mat-fg-muted);
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

	dd {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
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

	.viewer {
		width: 100vw;
		max-width: none;
		height: 100dvh;
		max-height: none;
		margin: 0;
		padding: 0;
		border: none;
		background: var(--color-stage-bg);
	}

	.viewer[open] {
		display: grid;
		place-items: center;
	}

	.viewer :global(img) {
		display: block;
		max-width: 100vw;
		max-height: 100dvh;
	}

	.close {
		position: absolute;
		top: var(--spacing-3);
		right: var(--spacing-3);
		color: var(--color-stage-fg);
	}

	@media (min-width: 768px) {
		.view {
			grid-template-columns: minmax(0, 1fr) auto;
			height: 100%;
		}

		.stage {
			container-type: size;
			padding: var(--spacing-6);
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
			padding: var(--spacing-4) var(--spacing-6) var(--spacing-12);
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
			padding: var(--spacing-4) 0;
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
