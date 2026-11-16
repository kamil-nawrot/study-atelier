<script lang="ts">
	import { untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { Alert, Button, Dialog, MetaLine, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
	import PosterFrame from '#lib/exhibitions/components/PosterFrame/PosterFrame.svelte';
	import PosterSlider from '#lib/exhibitions/components/PosterSlider/PosterSlider.svelte';
	import PosterThumbs from '#lib/exhibitions/components/PosterThumbs/PosterThumbs.svelte';
	import { saveExhibitionPoster } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
	import {
		FILTER_RANGES,
		NO_POSTER,
		POSTER_ZOOM,
		draftPoster,
		posterChoiceMissing,
		posterToSave,
		zoomedCrop,
		CENTRED_CROP
	} from '#lib/exhibitions/exhibition-poster/exhibition-poster.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
	import type { ExhibitionPoster } from '#lib/exhibitions/types/exhibition-poster.ts';
	import type { PosterCrop } from '#lib/exhibitions/types/poster-crop.ts';
	import type { PosterFilters } from '#lib/exhibitions/types/poster-filters.ts';

	type Props = {
		open?: boolean;
		exhibitionId: string;
		artworkIds: readonly string[];
		lookup: ArtworkLookup;
		stored: ExhibitionPoster;
		onsaved: (poster: ExhibitionPoster) => void;
	};

	const FILTER_NAMES = Object.keys(FILTER_RANGES) as (keyof PosterFilters)[];

	let {
		open = $bindable(false),
		exhibitionId,
		artworkIds,
		lookup,
		stored,
		onsaved
	}: Props = $props();

	const dialogId = $props.id();
	const hintId = `${dialogId}-hint`;

	let draft = $state.raw<ExhibitionPoster>(NO_POSTER);
	let choiceChanged = $state(false);
	let busy = $state(false);
	let error = $state<string>();
	let sideHeight = $state(0);

	const wide = new MediaQuery('min-width: 768px');

	let shownId = $derived(draft.artworkId ?? artworkIds[0]);
	let artwork = $derived(shownId ? lookup.get(shownId) : undefined);
	let pictures = $derived((shownId && lookup.pictures(shownId)) || []);
	let imageId = $derived(draft.imageId ?? pictures[0]?.id);
	let chosen = $derived(
		draft.imageId ? pictures.find(({ id }) => id === draft.imageId) : undefined
	);
	let picture = $derived(
		chosen
			? artworkImageSource(chosen, 800)
			: artwork?.image?.src
				? { src: artwork.image.src, srcset: artwork.image.srcset }
				: undefined
	);
	let missing = $derived(!choiceChanged && posterChoiceMissing(stored, artworkIds));
	let zoom = $derived(draft.crop?.zoom ?? 1);

	$effect(() => {
		if (!open) return;
		untrack(() => {
			draft = draftPoster(stored, artworkIds);
			choiceChanged = false;
			error = undefined;
		});
	});

	$effect(() => {
		if (open && shownId) void lookup.wantPictures(shownId);
	});

	function choose(change: Partial<ExhibitionPoster>): void {
		draft = { ...draft, artworkId: shownId ?? null, ...change };
		choiceChanged = true;
	}

	function crop(next: PosterCrop): void {
		choose({ crop: next });
	}

	function filter(name: keyof PosterFilters, value: number): void {
		draft = { ...draft, filters: { ...draft.filters, [name]: value } };
	}

	function reset(): void {
		draft = NO_POSTER;
		choiceChanged = true;
	}

	async function save(): Promise<void> {
		if (busy) return;
		busy = true;
		const poster = posterToSave(draft, stored, artworkIds, choiceChanged);
		const result = await saveExhibitionPoster(exhibitionId, poster);
		busy = false;
		error = result.error;
		if (result.error) return;
		onsaved(poster);
		open = false;
	}
</script>

<Dialog
	description={m.exhibitions.poster.description}
	size="wide"
	title={m.exhibitions.poster.title}
	bind:open
>
	<div class="layout">
		<div class="stage">
			<div
				style:width={wide.current && sideHeight > 0
					? `calc((${sideHeight}px - 2 * var(--spacing-6)) * 4 / 5)`
					: undefined}
				class="poster"
			>
				<PosterFrame
					crop={draft.crop}
					filters={draft.filters}
					{hintId}
					label={m.exhibitions.poster.crop}
					oncrop={crop}
					{picture}
				/>
			</div>
		</div>
		<div class="side" bind:clientHeight={sideHeight}>
			{#if error}
				<Alert title={m.exhibitions.poster.saveErrorTitle} tone="danger">{error}</Alert>
			{/if}
			{#if missing}
				<Alert tone="warning">{m.exhibitions.poster.missing}</Alert>
			{/if}
			<section>
				<h3 class="overline">{m.exhibitions.poster.artwork}</h3>
				<PosterThumbs
					chosen={shownId}
					items={artworkIds.map((id) => {
						const known = lookup.get(id);
						return { id, label: known?.title ?? '', src: known?.image?.src };
					})}
					onchoose={(id) => choose({ artworkId: id, imageId: null, crop: null })}
				/>
				{#if artwork}
					<MetaLine
						class="meta"
						text={[artwork.title, artwork.authors.join(', ')].filter(Boolean).join(' · ')}
					/>
				{/if}
			</section>
			{#if pictures.length > 1}
				<section>
					<h3 class="overline">{m.exhibitions.poster.image}</h3>
					<PosterThumbs
						chosen={imageId}
						items={pictures.flatMap((item, index) =>
							item.id
								? [
										{
											id: item.id,
											label: m.exhibitions.poster.imageLabel(index + 1, pictures.length),
											src: artworkImageSource(item, 120)?.src
										}
									]
								: []
						)}
						onchoose={(id) => choose({ imageId: id, crop: null })}
					/>
				</section>
			{/if}
			<section>
				<h3 class="overline">{m.exhibitions.poster.crop}</h3>
				<PosterSlider
					label={m.exhibitions.poster.zoom}
					max={POSTER_ZOOM.max}
					min={POSTER_ZOOM.min}
					oninput={(value) => crop(zoomedCrop(draft.crop ?? CENTRED_CROP, value))}
					shown={`${zoom.toFixed(1)}×`}
					step={0.1}
					value={zoom}
				/>
				<p id={hintId} class="hint">{m.exhibitions.poster.dragHint}</p>
			</section>
			<section>
				<h3 class="overline">{m.exhibitions.poster.filters}</h3>
				{#each FILTER_NAMES as name (name)}
					<PosterSlider
						label={m.exhibitions.poster.filterLabels[name]}
						max={FILTER_RANGES[name].max}
						min={FILTER_RANGES[name].min}
						oninput={(value) => filter(name, value)}
						shown={`${draft.filters[name]}%`}
						value={draft.filters[name]}
					/>
				{/each}
			</section>
		</div>
	</div>
	{#snippet footer()}
		<div class="footer">
			<Tooltip text={m.exhibitions.poster.resetHint}>
				<Button onclick={reset}>{m.exhibitions.poster.reset}</Button>
			</Tooltip>
			<span class="actions">
				<Button onclick={() => (open = false)}>{m.common.cancel}</Button>
				<Button disabled={busy} onclick={save} variant="primary">{m.common.save}</Button>
			</span>
		</div>
	{/snippet}
</Dialog>

<style>
	.layout {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--spacing-8);
		align-items: start;
	}

	.stage {
		padding: var(--spacing-6);
		background: var(--color-surface);
	}

	.poster {
		width: 16rem;
	}

	.side {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
	}

	section {
		display: grid;
		gap: var(--spacing-3);
	}

	h3 {
		margin: 0;
	}

	.hint,
	.side :global(.meta) {
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.footer {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-3);
		justify-content: space-between;
		width: 100%;
	}

	.actions {
		display: flex;
		gap: var(--spacing-3);
	}

	@media (max-width: 767.98px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.stage {
			justify-self: center;
			padding: var(--spacing-4);
		}
	}
</style>
