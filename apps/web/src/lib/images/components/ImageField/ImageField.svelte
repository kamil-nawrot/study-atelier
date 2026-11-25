<script lang="ts">
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash from '@lucide/svelte/icons/trash';
	import { onDestroy, tick, type Snippet } from 'svelte';
	import {
		ArtworkImage,
		Button,
		Dialog,
		Icon,
		ImageCredit,
		NoImage,
		Primer,
		StageBackdrop
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ImageSearchDialog from '#lib/images/components/ImageSearchDialog/ImageSearchDialog.svelte';
	import OwnImageDialog from '#lib/images/components/OwnImageDialog/OwnImageDialog.svelte';
	import ImageHints from '#lib/images/components/ImageHints/ImageHints.svelte';
	import { ImageInput, releaseImage } from '#lib/images/image-input/image-input.svelte.ts';
	import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
	import type { ImageSearchQuery } from '#lib/images/types/image-search-query.ts';
	import type { SameArtworkSource } from '#lib/images/same-artwork/same-artwork.ts';
	import { imageFromCandidate } from '#lib/images/image-candidate/image-candidate.ts';
	import {
		artworkImageCredit,
		artworkImageSource
	} from '#lib/images/artwork-image/artwork-image.ts';
	import type { ImageFieldTexts } from '#lib/images/types/image-field-texts.ts';
	import type { ImageHint } from '#lib/images/types/image-hint.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

	type Props = {
		alt: string;
		searchReady: boolean;
		query: ImageSearchQuery;
		sameArtwork?: SameArtworkSource | null;
		texts: ImageFieldTexts;
		image: ArtworkImageInput | null;
		removable?: boolean;
		onsearch?: () => void;
		slots?: Snippet;
		source?: Snippet;
		status?: Snippet;
		hints?: ImageHint[];
		overlay?: Snippet;
		removeWarning?: string;
		filling?: boolean;
		compactEmpty?: boolean;
		staged?: boolean;
	};

	let {
		alt,
		searchReady,
		query,
		sameArtwork = null,
		texts,
		image = $bindable(),
		removable = false,
		onsearch,
		slots,
		source,
		status,
		hints = [],
		overlay,
		removeWarning,
		filling = false,
		compactEmpty = false,
		staged = false
	}: Props = $props();

	const id = $props.id();
	const findImageId = `${id}-find`;
	const COMMONS_PREVIEW_WIDTH = 500;

	const input = new ImageInput(
		() => image,
		(next) => (image = next)
	);
	let removeOpen = $state(false);
	let height = $state(0);

	let preview = $derived(artworkImageSource(image, COMMONS_PREVIEW_WIDTH));
	let credit = $derived(artworkImageCredit(image));
	let ratio = $derived(
		preview?.width && preview.height ? preview.width / preview.height : undefined
	);
	let ownImage = $derived(image !== null && image.kind !== 'commons');

	function openSearch(): void {
		onsearch?.();
		input.searchOpen = true;
	}

	onDestroy(() => releaseImage(image));

	function pickCandidate(candidate: ImageCandidate): void {
		releaseImage(image);
		image = imageFromCandidate(candidate);
	}

	function askToRemove(): void {
		if (removeWarning) removeOpen = true;
		else void removeImage();
	}

	async function removeImage(): Promise<void> {
		removeOpen = false;
		releaseImage(image);
		image = null;
		await tick();
		document.getElementById(findImageId)?.focus();
	}
</script>

<svelte:window onpaste={(event) => input.handlePaste(event)} />

<section
	style:--image-height="{height}px"
	style:--image-ratio={ratio}
	class="image"
	class:filled={preview !== undefined || filling}
	class:sized={ratio !== undefined}
	class:staged
	aria-label={texts.label}
	bind:offsetHeight={height}
>
	{#if staged && preview}
		<StageBackdrop src={preview.src} />
	{/if}
	<div class="top">
		{@render slots?.()}
	</div>
	<figure class="picture">
		<div class="mat" class:compact={compactEmpty && !preview}>
			{#if preview}
				<div class="frame">
					<ArtworkImage
						{alt}
						height={preview.height}
						sizes="(min-width: 768px) 50vw, 100vw"
						src={preview.src}
						srcset={preview.srcset}
						width={preview.width}
					/>
					{@render overlay?.()}
					{#if credit}
						<ImageCredit label={m.artwork.creditLabel} text={credit} tone="mat" />
					{/if}
				</div>
			{:else if filling}
				<div class="primed" aria-busy="true">
					<Primer />
				</div>
			{:else}
				<div class="empty">
					<NoImage fill />
				</div>
			{/if}
		</div>
		{@render source?.()}
	</figure>

	<div class="image-actions">
		<Button
			id={findImageId}
			disabled={!searchReady || filling}
			onclick={openSearch}
			variant="primary"
		>
			<Icon icon={Search} size="sm" />
			{image?.kind === 'commons' ? texts.findOther : texts.find}
		</Button>
		<Button aria-haspopup="dialog" disabled={filling} onclick={() => (input.dialogOpen = true)}>
			<Icon icon={ImagePlus} size="sm" />
			{ownImage ? texts.changeOwn : texts.own}
		</Button>
		{#if image || removable}
			<Button onclick={askToRemove} variant="danger">
				<Icon icon={Trash} size="sm" />
				{texts.remove}
			</Button>
		{/if}
	</div>
	{@render status?.()}
	{#if input.pasteError}
		<p class="paste-error" role="alert">{input.pasteError}</p>
	{/if}
	<ImageHints hints={searchReady ? hints : [{ icon: Search, text: texts.findHint }, ...hints]} />
</section>

<ImageSearchDialog onpick={pickCandidate} {query} {sameArtwork} bind:open={input.searchOpen} />

<OwnImageDialog {input} title={ownImage ? texts.changeOwnTitle : texts.ownTitle} />

<Dialog
	description={m.artworkForm.replaceImageDescription}
	onclose={() => (input.pendingPaste = null)}
	size="small"
	title={m.artworkForm.replaceImageTitle}
	bind:open={input.replaceOpen}
>
	{#snippet footer()}
		<Button onclick={() => (input.replaceOpen = false)}>
			{m.artworkForm.keepImage}
		</Button>
		<Button onclick={() => input.replaceImage()} variant="primary">
			{m.common.replace}
		</Button>
	{/snippet}
</Dialog>

<Dialog
	description={removeWarning}
	size="small"
	title={m.artworkForm.removeImageTitle}
	bind:open={removeOpen}
>
	{#snippet footer()}
		<Button onclick={() => (removeOpen = false)}>
			{m.common.cancel}
		</Button>
		<Button onclick={removeImage} variant="danger">
			{m.common.delete}
		</Button>
	{/snippet}
</Dialog>

<style>
	.image {
		display: grid;
		align-content: start;
		gap: var(--spacing-4);
	}

	.picture {
		display: grid;
		gap: var(--spacing-2);
	}

	.mat {
		padding: var(--spacing-2);
		background: var(--color-mat-bg);
	}

	.frame {
		position: relative;
		isolation: isolate;
	}

	.primed {
		position: relative;
		aspect-ratio: 4 / 5;
		background: var(--color-mat-window);
		color: var(--color-mat-fg);
	}

	.empty {
		aspect-ratio: 4 / 5;
	}

	@media (max-width: 767.98px) {
		.compact .primed,
		.compact .empty {
			height: 140px;
			aspect-ratio: auto;
		}
	}

	.mat :global(img) {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
	}

	.image-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.image-actions > :global(*) {
		flex: 1 1 auto;
	}

	.paste-error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	@media (min-width: 768px) {
		.image {
			position: sticky;
			top: min(
				calc(var(--bar-height) + var(--spacing-4)),
				calc(100dvh - var(--image-height) - var(--spacing-24))
			);
			align-self: start;
		}

		.image-actions > :global(*) {
			flex: none;
		}
	}

	.staged {
		--color-stage-bg: var(--color-bg);
		--stage-room: calc(2 * var(--spacing-3) + var(--spacing-12));

		position: relative;
		isolation: isolate;
		overflow: hidden;
		background: var(--color-stage-bg);
	}

	.staged > :global(:not(.stage-backdrop)) {
		position: relative;
		z-index: 1;
	}

	.staged .picture {
		container-type: size;
		justify-items: center;
		align-content: center;
		min-height: 0;
	}

	.staged .mat {
		width: fit-content;
		max-width: 100%;
		padding: var(--spacing-3) var(--spacing-3) var(--spacing-4);
	}

	.staged .frame {
		width: fit-content;
	}

	.staged .mat :global(img) {
		width: auto;
		max-width: calc(100cqw - var(--stage-room, 0px));
		max-height: calc(100cqh - var(--stage-room, 0px));
	}

	.staged.sized .mat :global(img) {
		width: min(
			calc(100cqw - var(--stage-room, 0px)),
			calc((100cqh - var(--stage-room, 0px)) * var(--image-ratio))
		);
		max-height: none;
	}

	.staged .primed,
	.staged .empty {
		width: auto;
		height: calc(100cqh - var(--stage-room, 0px));
	}

	.staged .image-actions {
		justify-content: center;
	}

	@media (max-width: 767.98px) {
		.staged {
			gap: var(--spacing-4);
			padding: var(--spacing-4) var(--page-inline, var(--spacing-4)) var(--spacing-6);
		}

		.staged.filled .picture {
			height: 50svh;
		}

		.staged:not(.filled) .picture {
			container-type: normal;
		}

		.staged:not(.filled) .mat {
			width: 100%;
		}

		.staged:not(.filled) :is(.primed, .empty) {
			height: 140px;
		}
	}

	@media (min-width: 768px) {
		.staged {
			position: relative;
			top: auto;
			grid-template-rows: auto minmax(0, 1fr) auto auto;
			align-content: stretch;
			gap: var(--spacing-4);
			height: 100%;
			padding: var(--spacing-6) var(--spacing-8);
		}

		.staged > :global(.hints) {
			justify-self: center;
			min-height: calc(3 * var(--font-size-xs) * var(--line-height-xs) + 2 * var(--spacing-2));
			max-width: var(--size-content-default);
		}
	}
</style>
