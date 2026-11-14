<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import PinIcon from '@lucide/svelte/icons/pin';
	import Plus from '@lucide/svelte/icons/plus';
	import Star from '@lucide/svelte/icons/star';
	import { onDestroy, untrack } from 'svelte';
	import { Alert, ArtworkImage, Icon, TextButton, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { findImageCandidates } from '#lib/images/image-search/image-search.ts';
	import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
	import type { ImageSearchQuery } from '#lib/images/types/image-search-query.ts';
	import { MAX_ARTWORK_IMAGES } from '#lib/artworks/artwork-form/artwork-form.ts';
	import { imageFromCandidate } from '#lib/images/image-candidate/image-candidate.ts';
	import {
		AUTO_MATCH_DELAY_MS,
		isCandidateImage,
		matchKey,
		matchLabel,
		matchPool
	} from '#lib/images/auto-match/auto-match.ts';
	import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
	import type { ImageFieldTexts } from '#lib/images/types/image-field-texts.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
	import ImageField from '#lib/images/components/ImageField/ImageField.svelte';
	import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
	import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
	import PinLayer from '#lib/pins/components/PinLayer/PinLayer.svelte';
	import { pinsOfImage } from '#lib/pins/pin-layout/pin-layout.ts';
	import type { Pin } from '#lib/pins/types/pin.ts';
	import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
	import FillingStatus from '#lib/shared/forms/FillingStatus/FillingStatus.svelte';

	type Props = {
		alt: string;
		searchReady: boolean;
		query: ImageSearchQuery;
		texts: ImageFieldTexts;
		image: ArtworkImageInput | null;
		images: (ArtworkImageInput | null)[];
		autoMatch?: boolean;
		pins?: Pin[];
		entries?: readonly GlossaryTerm[];
		symbols?: readonly SymbolOption[];
		pinsError?: string;
		onmatching?: (matching: boolean) => void;
		compactEmpty?: boolean;
	};

	let {
		alt,
		searchReady,
		query,
		texts,
		image = $bindable(),
		images = $bindable(),
		autoMatch = false,
		pins = $bindable(),
		entries = [],
		symbols = [],
		pinsError,
		onmatching,
		compactEmpty = false
	}: Props = $props();

	type MatchStatus = 'idle' | 'searching' | 'matched' | 'none' | 'failed';

	const SLOT_WIDTH = 120;

	let selected = $state(0);
	let matchStatus = $state<MatchStatus>('idle');
	let matchError = $state('');
	let pool = $state<ImageCandidate[]>([]);
	let searchedKey = '';
	let matchRequest = 0;

	let slots = $derived([image, ...images]);
	let pinImageId = $derived(pins === undefined || pinsError ? undefined : current()?.id);
	let pinFailure = $state<string>();
	let currentPins = $derived(pins === undefined ? 0 : pinsOfImage(pins, current()?.id).length);
	let full = $derived(slots.length >= MAX_ARTWORK_IMAGES);
	let matchShown = $derived(
		selected === 0 && matchStatus === 'matched' && isCandidateImage(image, pool[0])
	);

	$effect.pre(() => {
		void pinImageId;
		pinFailure = undefined;
	});

	$effect(() => {
		onmatching?.(matchStatus === 'searching');
	});

	$effect(() => {
		const typed = query.kind === 'artwork' ? matchKey(query.title, query.authors) : '';
		untrack(() => {
			if (matchStatus !== 'searching' || typed === searchedKey) return;
			matchRequest += 1;
			matchStatus = 'idle';
		});
		if (
			!autoMatch ||
			!autoFetch.image ||
			!searchReady ||
			query.kind !== 'artwork' ||
			image !== null
		)
			return;
		const key = matchKey(query.title, query.authors);
		if (key === untrack(() => searchedKey)) return;
		const timer = setTimeout(() => {
			if (key !== searchedKey) void runMatch(key);
		}, AUTO_MATCH_DELAY_MS);
		return () => clearTimeout(timer);
	});

	async function runMatch(key: string): Promise<void> {
		if (query.kind !== 'artwork') return;
		searchedKey = key;
		const current = ++matchRequest;
		matchStatus = 'searching';
		const result = await findImageCandidates(query);
		if (current !== matchRequest) return;
		if (image !== null) {
			matchStatus = 'idle';
			return;
		}
		if (result.error !== undefined) {
			matchError = result.error;
			matchStatus = 'failed';
			return;
		}
		pool = matchPool(result, query.authors.length === 0);
		if (pool.length === 0) {
			matchStatus = 'none';
			return;
		}
		image = imageFromCandidate(pool[0]);
		matchStatus = 'matched';
	}

	function stopMatch(): void {
		if (query.kind === 'artwork') searchedKey = matchKey(query.title, query.authors);
		matchRequest += 1;
		if (matchStatus === 'searching') matchStatus = 'idle';
	}

	$effect.pre(() => {
		if (selected > images.length) selected = images.length;
	});

	onDestroy(() => {
		for (const slot of [image, ...images]) {
			if (slot?.kind === 'file') URL.revokeObjectURL(slot.previewUrl);
		}
	});

	function current(): ArtworkImageInput | null {
		return selected === 0 ? image : (images[selected - 1] ?? null);
	}

	function setCurrent(next: ArtworkImageInput | null): void {
		const id = current()?.id;
		if (next !== null && id !== undefined && next.id === undefined) next = { ...next, id };
		if (selected === 0) {
			if (next === null && images.length > 0) {
				const [first, ...rest] = images;
				image = first;
				images = rest;
				return;
			}
			image = next;
			return;
		}
		if (next === null) {
			images = images.filter((_, index) => index !== selected - 1);
			selected = Math.min(selected, images.length);
			return;
		}
		images = images.map((slot, index) => (index === selected - 1 ? next : slot));
	}

	function addSlot(): void {
		images = [...images, null];
		selected = images.length;
	}

	function makeMain(): void {
		const chosen = images[selected - 1];
		images = images.map((slot, index) => (index === selected - 1 ? image : slot));
		image = chosen;
		selected = 0;
	}
</script>

{#snippet slotButton(
	index: number,
	preview: ReturnType<typeof artworkImageSource>,
	describedby?: string
)}
	<button
		class="slot"
		class:selected={index === selected}
		aria-describedby={describedby}
		aria-label={m.artworkForm.imageSlot(index + 1, slots.length)}
		aria-pressed={index === selected}
		onclick={() => (selected = index)}
		type="button"
	>
		<span class="thumb" aria-hidden="true">
			{#if preview}
				<ArtworkImage
					alt=""
					height={preview.height}
					sizes="{SLOT_WIDTH}px"
					src={preview.src}
					srcset={preview.srcset}
					width={preview.width}
				/>
			{:else}
				<span class="empty">
					<Icon icon={ImageIcon} size="sm" />
				</span>
			{/if}
		</span>
		{#if index === 0}
			<span class="main" aria-hidden="true"><Icon icon={Star} size="sm" /></span>
		{/if}
	</button>
{/snippet}

{#snippet slotRow()}
	<div class="slots">
		{#each slots as slot, index (index)}
			{@const preview = artworkImageSource(slot, SLOT_WIDTH)}
			{#if index === 0}
				<Tooltip placement="bottom" text={m.artworkForm.mainImage}>
					{#snippet children(id)}
						{@render slotButton(index, preview, id)}
					{/snippet}
				</Tooltip>
			{:else}
				{@render slotButton(index, preview)}
			{/if}
		{/each}
		{#if !full}
			<button
				class="slot add"
				aria-label={m.artworkForm.addImage}
				onclick={addSlot}
				title={m.artworkForm.addImage}
				type="button"
			>
				<Icon icon={Plus} />
			</button>
		{/if}
		{#if selected > 0 && current() !== null}
			<TextButton inline onclick={makeMain}>
				<span class="star"><Icon icon={Star} size="sm" /></span>{m.artworkForm.setMainImage}
			</TextButton>
		{/if}
	</div>
{/snippet}

{#snippet pinLayer()}
	{#if pins !== undefined && pinImageId !== undefined}
		<PinLayer
			{entries}
			image={current()}
			imageId={pinImageId}
			onfailure={(message) => (pinFailure = message)}
			{symbols}
			bind:pins
		/>
	{/if}
{/snippet}

{#snippet pinStatus()}
	{#if pinsError && current()?.id !== undefined}
		<Alert tone="danger">{m.pins.loadFailed}</Alert>
	{/if}
	{#if pinImageId !== undefined && pinFailure}
		<Alert tone="danger">{pinFailure}</Alert>
	{/if}
{/snippet}

{#snippet matchStatusLine()}
	{#if matchStatus === 'searching'}
		<FillingStatus message={m.artworkForm.matchSearching} onstop={stopMatch} />
	{:else if matchShown}
		<p class="caption" aria-live="polite">{matchLabel(pool[0])}</p>
	{:else if selected === 0 && image === null && matchStatus === 'none'}
		<p class="caption" aria-live="polite">{m.artworkForm.matchNone}</p>
	{:else if selected === 0 && image === null && matchStatus === 'failed'}
		<p class="caption" aria-live="polite">{matchError}</p>
	{/if}
{/snippet}

<ImageField
	{alt}
	{compactEmpty}
	filling={selected === 0 && matchStatus === 'searching'}
	hints={pinImageId === undefined
		? []
		: [{ icon: PinIcon, text: `${m.pins.editHint} ${m.pins.editorNote}` }]}
	onsearch={stopMatch}
	overlay={pinLayer}
	{query}
	removable={selected > 0}
	removeWarning={currentPins > 0 ? m.pins.imagePins(currentPins) : undefined}
	{searchReady}
	slots={slotRow}
	source={matchStatusLine}
	status={pinStatus}
	{texts}
	bind:image={current, setCurrent}
/>

<style>
	.slots {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-2);
	}

	.slots > :global(:last-child:not(.slot)) {
		margin-left: auto;
	}

	.slot {
		position: relative;
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		padding: 0;
		overflow: hidden;
		border: var(--border-width-base) solid var(--color-fg-muted);
		background: var(--color-surface);
		color: var(--color-fg);
		cursor: pointer;
		opacity: 0.6;
	}

	.slot.selected,
	.slot.add {
		opacity: 1;
	}

	.slot.selected {
		border-color: var(--color-fg);
	}

	.thumb {
		display: grid;
		width: 100%;
		height: 100%;
	}

	.thumb :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.main {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		display: grid;
		place-items: center;
		padding: var(--spacing-1);
		background: color-mix(in srgb, var(--color-stage-bg) 60%, transparent);
		color: var(--color-stage-fg);
	}

	.main :global(svg) {
		width: var(--spacing-4);
		height: var(--spacing-4);
		fill: currentColor;
	}

	.star {
		display: inline-block;
		padding-right: var(--spacing-1);
		vertical-align: middle;
	}

	.empty {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		color: var(--color-fg-muted);
	}

	.add {
		border-style: dashed;
		background: transparent;
		color: var(--color-fg-muted);
	}
</style>
