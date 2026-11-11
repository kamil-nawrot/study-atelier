<script lang="ts">
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash from '@lucide/svelte/icons/trash';
	import { onDestroy, tick, type Snippet } from 'svelte';
	import { ArtworkImage, Button, Dialog, Icon, NoImage, Primer } from '@study-atelier/ui';
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
	import type { ImageHint } from '#lib/images/types/image-hint.ts';
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
		source?: Snippet;
		status?: Snippet;
		hints?: ImageHint[];
		overlay?: Snippet;
		removeWarning?: string;
		filling?: boolean;
		compactEmpty?: boolean;
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
		source,
		status,
		hints = [],
		overlay,
		removeWarning,
		filling = false,
		compactEmpty = false
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
	class="image"
	aria-label={texts.label}
	bind:offsetHeight={height}
>
	{@render slots?.()}
	<figure class="picture">
		<div class="mat" class:compact={compactEmpty && !preview}>
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
		{#if credit}
			<figcaption class="caption">{credit}</figcaption>
		{/if}
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
	<ul class="hints">
		{#if !searchReady}
			<li class="caption">
				<Icon icon={Search} size="sm" />
				<span>{texts.findHint}</span>
			</li>
		{/if}
		{#each hints as hint (hint.text)}
			<li class="caption">
				<Icon icon={hint.icon} size="sm" />
				<span>{hint.text}</span>
			</li>
		{/each}
		<li class="caption paste-hint">
			<Icon icon={Clipboard} size="sm" />
			<span>
				{m.artworkForm.pasteHintForm}
				<PasteKeys />
			</span>
		</li>
	</ul>
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

	.hints {
		display: grid;
		gap: var(--spacing-2);
		margin: 0;
		list-style: none;
	}

	.hints li {
		display: flex;
		align-items: start;
		gap: var(--spacing-2);
	}

	.hints li > :global(svg) {
		flex: none;
	}

	.hints li.paste-hint {
		display: none;
	}

	.paste-error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	@media (pointer: fine) {
		.hints li.paste-hint {
			display: flex;
		}
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
</style>
