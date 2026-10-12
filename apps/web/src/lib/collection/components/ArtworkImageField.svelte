<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash from '@lucide/svelte/icons/trash';
	import Upload from '@lucide/svelte/icons/upload';
	import { Button, Icon, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { OWN_IMAGE_MAX_MEGABYTES, OWN_IMAGE_TYPES, ownImageFormats } from '#lib/images/bucket.ts';
	import { ownImageFileError, parseImageUrl, readImageSize } from '#lib/images/own-image.ts';
	import type { ArtworkImageInput } from '../types.ts';

	type Props = {
		alt: string;
		searchReady: boolean;
		image: ArtworkImageInput | null;
	};

	let { alt, searchReady, image = $bindable() }: Props = $props();

	const panelId = $props.id();
	const fileMessageId = `${panelId}-file`;
	const fileHint = m.artworkForm.fileHint(ownImageFormats(), OWN_IMAGE_MAX_MEGABYTES);

	let panelOpen = $state(false);
	let fileError = $state('');
	let urlText = $state('');
	let urlError = $state('');
	let loadingUrl = $state(false);
	let fileInput = $state<HTMLInputElement>();

	let preview = $derived(
		image?.kind === 'file'
			? { src: image.previewUrl, width: image.width, height: image.height }
			: image?.kind === 'url'
				? { src: image.url, width: image.width ?? undefined, height: image.height ?? undefined }
				: undefined
	);
	let ownImage = $derived(image !== null && image.kind !== 'commons');

	$effect(() => {
		const previewUrl = image?.kind === 'file' ? image.previewUrl : null;
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	});

	export function closeOwnImage(): void {
		panelOpen = false;
		fileError = '';
		urlText = '';
		urlError = '';
	}

	function toggleOwnImage(): void {
		if (panelOpen) closeOwnImage();
		else panelOpen = true;
	}

	function useImage(next: ArtworkImageInput): void {
		image = next;
		closeOwnImage();
	}

	function removeImage(): void {
		image = null;
		closeOwnImage();
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
			useImage({ kind: 'url', url: parsed.url, ...size });
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
				<img {alt} height={preview.height} src={preview.src} width={preview.width} />
			{:else}
				<div class="window">
					<Icon icon={ImageIcon} />
				</div>
			{/if}
		</div>
		{#if image?.kind === 'url'}
			<figcaption class="caption">
				{m.artworkForm.ownImageUrlCredit(new URL(image.url).hostname)}
			</figcaption>
		{:else if ownImage}
			<figcaption class="caption">{m.artworkForm.ownImageCredit}</figcaption>
		{/if}
	</figure>

	<div class="image-actions">
		<Button disabled={!searchReady}>
			<Icon icon={Search} size="sm" />
			{m.artworkForm.findImage}
		</Button>
		<Button aria-controls={panelId} aria-expanded={panelOpen} onclick={toggleOwnImage}>
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

	{#if panelOpen}
		<div id={panelId} class="own-image">
			<div class="file">
				<Button aria-describedby={fileMessageId} onclick={() => fileInput?.click()}>
					<Icon icon={Upload} size="sm" />
					{m.artworkForm.chooseFile}
				</Button>
				<input
					bind:this={fileInput}
					accept={OWN_IMAGE_TYPES.join(',')}
					hidden
					onchange={pickFile}
					type="file"
				/>
				<span id={fileMessageId} class="message" class:error={!!fileError}>
					{fileError || fileHint}
				</span>
			</div>
			<div class="url">
				<TextField
					autocomplete="off"
					error={urlError || undefined}
					inputmode="url"
					label={m.artworkForm.imageUrl}
					onkeydown={useUrlOnEnter}
					placeholder={m.artworkForm.imageUrlPlaceholder}
					type="url"
					bind:value={urlText}
				/>
				<Button disabled={loadingUrl} onclick={useUrl}>
					{loadingUrl ? m.artworkForm.usingImageUrl : m.artworkForm.useImageUrl}
				</Button>
			</div>
		</div>
	{/if}
</section>

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
		flex: 1 1 0;
	}

	.own-image {
		display: grid;
		gap: var(--spacing-4);
		padding: var(--spacing-3);
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-surface);
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

	.url {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		gap: var(--spacing-2);
	}

	.url > :global(:last-child) {
		margin-top: calc(var(--font-size-sm) * var(--line-height-sm) + var(--spacing-2));
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
