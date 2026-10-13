<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Search from '@lucide/svelte/icons/search';
	import Trash from '@lucide/svelte/icons/trash';
	import Upload from '@lucide/svelte/icons/upload';
	import { tick } from 'svelte';
	import { ArtworkImage, Button, Dialog, Icon, TextField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import {
		OWN_IMAGE_ACCEPT,
		OWN_IMAGE_MAX_MEGABYTES,
		ownImageFormats
	} from '#lib/images/bucket.ts';
	import {
		contentFromPasteEvent,
		pasteShortcut,
		pastedImageFrom,
		readClipboard,
		type PastedImage
	} from '#lib/images/clipboard.ts';
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
	const SHORTCUT_TARGETS = 'input, textarea, select';
	const fileHint = m.artworkForm.fileHint(ownImageFormats(), OWN_IMAGE_MAX_MEGABYTES);

	let dialogOpen = $state(false);
	let searchOpen = $state(false);
	let fileError = $state('');
	let urlText = $state('');
	let urlError = $state('');
	let loadingUrl = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let pasting = $state(false);
	let pasteError = $state('');
	let replaceOpen = $state(false);
	let pendingPaste = $state<PastedImage | null>(null);

	const shortcut = pasteShortcut();

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
		pasteError = '';
		dialogOpen = false;
	}

	async function useFile(file: File): Promise<string | undefined> {
		const error = ownImageFileError(file);
		if (error) return error;

		const previewUrl = URL.createObjectURL(file);
		try {
			const size = await readImageSize(previewUrl);
			useImage({ kind: 'file', file, previewUrl, ...size });
			return undefined;
		} catch {
			URL.revokeObjectURL(previewUrl);
			return m.ownImageErrors.fileUnreadable;
		}
	}

	async function usePasted(pasted: PastedImage): Promise<string | undefined> {
		if ('file' in pasted) return useFile(pasted.file);
		try {
			const size = await readImageSize(pasted.url);
			useImage({ kind: 'url', url: pasted.url, ...size });
			return undefined;
		} catch {
			return m.ownImageErrors.urlUnreadable;
		}
	}

	async function pickFile(event: Event & { currentTarget: HTMLInputElement }): Promise<void> {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		fileError = (await useFile(file)) ?? '';
	}

	async function pasteFromClipboard(): Promise<void> {
		fileError = '';
		urlError = '';
		pasting = true;
		const result = await readClipboard();
		pasting = false;
		if (!dialogOpen) return;
		if (!('content' in result)) {
			fileError = m.ownImageErrors.clipboardDenied;
			return;
		}
		const pasted = pastedImageFrom(result.content);
		fileError = pasted ? ((await usePasted(pasted)) ?? '') : m.ownImageErrors.clipboardEmpty;
	}

	async function pasteIntoForm(pasted: PastedImage): Promise<void> {
		pasteError = '';
		if ('file' in pasted) {
			pasteError = ownImageFileError(pasted.file) ?? '';
			if (pasteError) return;
		}
		if (image) {
			pendingPaste = pasted;
			replaceOpen = true;
			return;
		}
		pasteError = (await usePasted(pasted)) ?? '';
	}

	async function replaceImage(): Promise<void> {
		const pasted = pendingPaste;
		replaceOpen = false;
		if (pasted) pasteError = (await usePasted(pasted)) ?? '';
	}

	function handlePaste(event: ClipboardEvent): void {
		const { target, clipboardData } = event;
		if (!clipboardData || event.defaultPrevented || searchOpen || replaceOpen) return;
		if (target instanceof Element) {
			if (target.closest(SHORTCUT_TARGETS)) return;
			if (target instanceof HTMLElement && target.isContentEditable) return;
			if (!dialogOpen && target.closest('dialog')) return;
		}
		const pasted = pastedImageFrom(contentFromPasteEvent(clipboardData));
		if (!pasted) return;
		event.preventDefault();
		if (!dialogOpen) {
			void pasteIntoForm(pasted);
			return;
		}
		fileError = '';
		void usePasted(pasted).then((error) => {
			fileError = error ?? '';
		});
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

{#snippet shortcutKeys()}
	{#each shortcut.keys as key, index (key)}{#if index > 0 && shortcut.keys[0] !== '⌘'}+{/if}<kbd
			>{key}</kbd
		>{/each}.
{/snippet}

<svelte:window onpaste={handlePaste} />

<section class="image" aria-label={m.artworkForm.image}>
	<figure class="picture">
		<div class="mat">
			{#if preview}
				<ArtworkImage
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
	{#if pasteError}
		<p class="paste-error" role="alert">{pasteError}</p>
	{/if}
	<p class="caption paste-hint">
		{m.artworkForm.pasteHintForm}
		{@render shortcutKeys()}
	</p>
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
		<div class="paste-area">
			<Icon icon={Clipboard} />
			<p class="paste-lead">
				{m.artworkForm.pasteHintLead}
				{@render shortcutKeys()}
			</p>
			<div class="paste-actions">
				<Button aria-describedby={fileMessageId} disabled={pasting} onclick={pasteFromClipboard}>
					<Icon icon={Clipboard} size="sm" />
					{m.artworkForm.pasteFromClipboard}
				</Button>
				<Button aria-describedby={fileMessageId} onclick={() => fileInput?.click()}>
					<Icon icon={Upload} size="sm" />
					{m.artworkForm.chooseFile}
				</Button>
			</div>
			<input
				bind:this={fileInput}
				accept={OWN_IMAGE_ACCEPT}
				hidden
				onchange={pickFile}
				type="file"
			/>
			<span id={fileMessageId} class="message" class:error={!!fileError} aria-live="polite">
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

<Dialog
	description={m.artworkForm.replaceImageDescription}
	onclose={() => (pendingPaste = null)}
	size="small"
	title={m.artworkForm.replaceImageTitle}
	bind:open={replaceOpen}
>
	{#snippet footer()}
		<Button onclick={() => (replaceOpen = false)}>
			{m.artworkForm.keepImage}
		</Button>
		<Button onclick={replaceImage} variant="primary">
			{m.artworkForm.replaceImage}
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

	.mat :global(img) {
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

	.paste-area {
		display: grid;
		justify-items: center;
		gap: var(--spacing-3);
		padding: var(--spacing-6) var(--spacing-4);
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-surface);
		color: var(--color-fg-muted);
		text-align: center;
	}

	.paste-lead {
		margin: 0;
	}

	.paste-lead kbd,
	.paste-hint kbd {
		padding: 0 var(--spacing-1);
		border: var(--border-width-base) solid var(--color-fg-muted);
		color: var(--color-fg);
		font: inherit;
	}

	.paste-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--spacing-2);
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

	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
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
