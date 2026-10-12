<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash from '@lucide/svelte/icons/trash';
	import Upload from '@lucide/svelte/icons/upload';
	import { tick } from 'svelte';
	import { Button, Dialog, Icon, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import {
		OWN_IMAGE_ACCEPT,
		OWN_IMAGE_MAX_MEGABYTES,
		ownImageFormats
	} from '#lib/images/bucket.ts';
	import ImageSearchDialog from '#lib/images/components/ImageSearchDialog.svelte';
	import { ownImageFileError, parseImageUrl, readImageSize } from '#lib/images/own-image.ts';
	import type { ImageCandidate } from '#lib/images/types.ts';
	import { imageFromCandidate } from '../artwork-form.ts';
	import { artworkImageCredit, artworkImageSource } from '../artwork-image.ts';
	import type { ArtworkImageInput } from '../types.ts';

	type Props = {
		alt: string;
		searchReady: boolean;
		searchTitle: string;
		searchAuthors: string[];
		image: ArtworkImageInput | null;
	};

	let { alt, searchReady, searchTitle, searchAuthors, image = $bindable() }: Props = $props();

	const id = $props.id();
	const fileMessageId = `${id}-file`;
	const findImageId = `${id}-find`;
	const COMMONS_PREVIEW_WIDTH = 500;
	const fileHint = m.artworkForm.fileHint(ownImageFormats(), OWN_IMAGE_MAX_MEGABYTES);

	let dialogOpen = $state(false);
	let searchOpen = $state(false);
	let fileError = $state('');
	let urlText = $state('');
	let urlError = $state('');
	let loadingUrl = $state(false);
	let fileInput = $state<HTMLInputElement>();

	let preview = $derived(artworkImageSource(image, COMMONS_PREVIEW_WIDTH));
	let credit = $derived(artworkImageCredit(image));
	let ownImage = $derived(image !== null && image.kind !== 'commons');

	$effect(() => {
		const previewUrl = image?.kind === 'file' ? image.previewUrl : null;
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	});

	function pickCandidate(candidate: ImageCandidate): void {
		image = imageFromCandidate(candidate);
	}

	async function removeImage(): Promise<void> {
		image = null;
		await tick();
		document.getElementById(findImageId)?.focus();
	}

	function resetOwnImage(): void {
		fileError = '';
		urlText = '';
		urlError = '';
	}

	function useImage(next: ArtworkImageInput): void {
		image = next;
		dialogOpen = false;
	}

	async function pickFile(event: Event & { currentTarget: HTMLInputElement }): Promise<void> {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		fileError = ownImageFileError(file) ?? '';
		if (fileError) return;

		const previewUrl = URL.createObjectURL(file);
		try {
			const size = await readImageSize(previewUrl);
			useImage({ kind: 'file', file, previewUrl, ...size });
		} catch {
			URL.revokeObjectURL(previewUrl);
			fileError = m.ownImageErrors.fileUnreadable;
		}
	}

	async function useUrl(): Promise<void> {
		const parsed = parseImageUrl(urlText);
		if ('error' in parsed) {
			urlError = parsed.error;
			return;
		}
		urlError = '';
		loadingUrl = true;
		try {
			const size = await readImageSize(parsed.url);
			if (dialogOpen) useImage({ kind: 'url', url: parsed.url, ...size });
		} catch {
			urlError = m.ownImageErrors.urlUnreadable;
		} finally {
			loadingUrl = false;
		}
	}

	function useUrlOnEnter(event: KeyboardEvent): void {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		void useUrl();
	}
</script>

<section class="image" aria-label={m.artworkForm.image}>
	<figure class="picture">
		<div class="mat">
			{#if preview}
				<img
					{alt}
					height={preview.height}
					sizes="(min-width: 768px) 40vw, 100vw"
					src={preview.src}
					srcset={preview.srcset}
					width={preview.width}
				/>
			{:else}
				<div class="window">
					<Icon icon={ImageIcon} />
				</div>
			{/if}
		</div>
		{#if credit}
			<figcaption class="caption">{credit}</figcaption>
		{/if}
	</figure>

	<div class="image-actions">
		<Button id={findImageId} disabled={!searchReady} onclick={() => (searchOpen = true)}>
			<Icon icon={Search} size="sm" />
			{image?.kind === 'commons' ? m.artworkForm.chooseOtherImage : m.artworkForm.findImage}
		</Button>
		<Button aria-haspopup="dialog" onclick={() => (dialogOpen = true)}>
			<Icon icon={ImagePlus} size="sm" />
			{ownImage ? m.artworkForm.changeOwnImage : m.artworkForm.ownImage}
		</Button>
		{#if image}
			<Button onclick={removeImage}>
				<Icon icon={Trash} size="sm" />
				{m.artworkForm.removeImage}
			</Button>
		{/if}
	</div>
	{#if !searchReady}
		<p class="caption">{m.artworkForm.findImageHint}</p>
	{/if}
</section>

<ImageSearchDialog
	authors={searchAuthors}
	onpick={pickCandidate}
	title={searchTitle}
	bind:open={searchOpen}
/>

<Dialog
	onclose={resetOwnImage}
	title={ownImage ? m.artworkForm.changeOwnImageTitle : m.artworkForm.ownImageTitle}
	bind:open={dialogOpen}
>
	<div class="own-image">
		<div class="file">
			<Button aria-describedby={fileMessageId} onclick={() => fileInput?.click()}>
				<Icon icon={Upload} size="sm" />
				{m.artworkForm.chooseFile}
			</Button>
			<input
				bind:this={fileInput}
				accept={OWN_IMAGE_ACCEPT}
				hidden
				onchange={pickFile}
				type="file"
			/>
			<span id={fileMessageId} class="message" class:error={!!fileError}>
				{fileError || fileHint}
			</span>
		</div>
		<TextField
			autocomplete="off"
			error={urlError || undefined}
			inputmode="url"
			label={m.artworkForm.imageUrl}
			onkeydown={useUrlOnEnter}
			placeholder={m.artworkForm.imageUrlPlaceholder}
			type="url"
			bind:value={urlText}
		>
			{#snippet action()}
				<Button disabled={loadingUrl} onclick={useUrl}>
					{loadingUrl ? m.artworkForm.usingImageUrl : m.artworkForm.useImageUrl}
				</Button>
			{/snippet}
		</TextField>
	</div>
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

	img {
		display: block;
		width: 100%;
		height: auto;
		background: var(--color-mat-window);
	}

	.window {
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 5;
		background: var(--color-mat-window);
		color: var(--color-mat-fg-muted);
	}

	.image-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.image-actions > :global(*) {
		flex: 1 1 auto;
	}

	.own-image {
		display: grid;
		gap: var(--spacing-6);
	}

	.file {
		display: grid;
		justify-items: start;
		gap: var(--spacing-2);
	}

	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
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
