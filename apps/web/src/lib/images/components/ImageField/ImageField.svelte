<script lang="ts">
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash from '@lucide/svelte/icons/trash';
	import { onDestroy, tick, type Snippet } from 'svelte';
	import { ArtworkImage, Button, Dialog, Icon, NoImage } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ImageSearchDialog from '#lib/images/components/ImageSearchDialog/ImageSearchDialog.svelte';
	import OwnImageDialog from '#lib/images/components/OwnImageDialog/OwnImageDialog.svelte';
	import PasteKeys from '#lib/images/components/PasteKeys/PasteKeys.svelte';
	import { ImageInput, releaseImage } from '#lib/images/image-input/image-input.svelte.ts';
	import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
	import type { ImageSearchQuery } from '#lib/images/types/image-search-query.ts';
	import { imageFromCandidate } from '#lib/images/image-candidate/image-candidate.ts';
	import {
		artworkImageCredit,
		artworkImageSource
	} from '#lib/images/artwork-image/artwork-image.ts';
	import type { ImageFieldTexts } from '#lib/images/types/image-field-texts.ts';
	import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

	type Props = {
		alt: string;
		searchReady: boolean;
		query: ImageSearchQuery;
		texts: ImageFieldTexts;
		image: ArtworkImageInput | null;
		removable?: boolean;
		onsearch?: () => void;
		slots?: Snippet;
		status?: Snippet;
		overlay?: Snippet;
		removeWarning?: string;
	};

	let {
		alt,
		searchReady,
		query,
		texts,
		image = $bindable(),
		removable = false,
		onsearch,
		slots,
		status,
		overlay,
		removeWarning
	}: Props = $props();

	const id = $props.id();
	const findImageId = `${id}-find`;
	const COMMONS_PREVIEW_WIDTH = 500;

	const input = new ImageInput(
		() => image,
		(next) => (image = next)
	);
	let removeOpen = $state(false);

	let preview = $derived(artworkImageSource(image, COMMONS_PREVIEW_WIDTH));
	let credit = $derived(artworkImageCredit(image));
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

<section class="image" aria-label={texts.label}>
	{@render slots?.()}
	<figure class="picture">
		<div class="mat">
			{#if preview}
				<div class="frame">
					<ArtworkImage
						{alt}
						height={preview.height}
						sizes="(min-width: 768px) 40vw, 100vw"
						src={preview.src}
						srcset={preview.srcset}
						width={preview.width}
					/>
					{@render overlay?.()}
				</div>
			{:else}
				<NoImage />
			{/if}
		</div>
		{#if credit}
			<figcaption class="caption">{credit}</figcaption>
		{/if}
	</figure>

	<div class="image-actions">
		<Button id={findImageId} disabled={!searchReady} onclick={openSearch}>
			<Icon icon={Search} size="sm" />
			{image?.kind === 'commons' ? texts.findOther : texts.find}
		</Button>
		<Button aria-haspopup="dialog" onclick={() => (input.dialogOpen = true)}>
			<Icon icon={ImagePlus} size="sm" />
			{ownImage ? texts.changeOwn : texts.own}
		</Button>
		{#if image || removable}
			<Button onclick={askToRemove}>
				<Icon icon={Trash} size="sm" />
				{texts.remove}
			</Button>
		{/if}
	</div>
	{@render status?.()}
	{#if !searchReady}
		<p class="caption">{texts.findHint}</p>
	{/if}
	{#if input.pasteError}
		<p class="paste-error" role="alert">{input.pasteError}</p>
	{/if}
	<p class="caption paste-hint">
		{m.artworkForm.pasteHintForm}
		<PasteKeys />
	</p>
</section>

<ImageSearchDialog onpick={pickCandidate} {query} bind:open={input.searchOpen} />

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
		gap: var(--spacing-3);
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

	.paste-hint {
		display: none;
	}

	.paste-error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	@media (pointer: fine) {
		.paste-hint {
			display: block;
		}
	}

	@media (min-width: 768px) {
		.image {
			position: sticky;
			top: var(--spacing-24);
		}

		.image-actions > :global(*) {
			flex: none;
		}
	}
</style>
