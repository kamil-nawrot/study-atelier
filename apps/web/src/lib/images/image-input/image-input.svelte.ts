import { m } from '#lib/i18n/i18n.ts';
import {
	contentFromPasteEvent,
	pastedImageFrom,
	readClipboard
} from '#lib/images/clipboard/clipboard.ts';
import {
	fitOwnImage,
	ownImageFileError,
	parseImageUrl,
	readImageSize
} from '#lib/images/own-image/own-image.ts';
import type { PastedImage } from '#lib/images/types/pasted-image.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

const SHORTCUT_TARGETS = 'input, textarea, select';

export function releaseImage(previous: ArtworkImageInput | null): void {
	if (previous?.kind === 'file') URL.revokeObjectURL(previous.previewUrl);
}

export class ImageInput {
	dialogOpen = $state(false);
	searchOpen = $state(false);
	fileError = $state('');
	urlText = $state('');
	urlError = $state('');
	loadingUrl = $state(false);
	pasting = $state(false);
	pasteError = $state('');
	replaceOpen = $state(false);
	pendingPaste = $state<PastedImage | null>(null);

	readonly #image: () => ArtworkImageInput | null;
	readonly #setImage: (next: ArtworkImageInput | null) => void;

	constructor(
		image: () => ArtworkImageInput | null,
		setImage: (next: ArtworkImageInput | null) => void
	) {
		this.#image = image;
		this.#setImage = setImage;
	}

	resetOwnImage(): void {
		this.fileError = '';
		this.urlText = '';
		this.urlError = '';
	}

	#useImage(next: ArtworkImageInput): void {
		releaseImage(this.#image());
		this.#setImage(next);
		this.pasteError = '';
		this.dialogOpen = false;
	}

	async #useFile(picked: File): Promise<string | undefined> {
		const error = ownImageFileError(picked);
		if (error) return error;
		const fitted = await fitOwnImage(picked);
		if ('error' in fitted) return fitted.error;

		const file = fitted.file;
		const previewUrl = URL.createObjectURL(file);
		try {
			const size = await readImageSize(previewUrl);
			this.#useImage({ kind: 'file', file, previewUrl, ...size });
			return undefined;
		} catch {
			URL.revokeObjectURL(previewUrl);
			return m.ownImageErrors.fileUnreadable;
		}
	}

	async #usePasted(pasted: PastedImage): Promise<string | undefined> {
		if ('file' in pasted) return this.#useFile(pasted.file);
		try {
			const size = await readImageSize(pasted.url);
			this.#useImage({ kind: 'url', url: pasted.url, ...size });
			return undefined;
		} catch {
			return m.ownImageErrors.urlUnreadable;
		}
	}

	async pickFile(file: File): Promise<void> {
		this.fileError = (await this.#useFile(file)) ?? '';
	}

	async pasteFromClipboard(): Promise<void> {
		this.fileError = '';
		this.urlError = '';
		this.pasting = true;
		const result = await readClipboard();
		this.pasting = false;
		if (!this.dialogOpen) return;
		if (!('content' in result)) {
			this.fileError = m.ownImageErrors.clipboardDenied;
			return;
		}
		const pasted = pastedImageFrom(result.content);
		this.fileError = pasted
			? ((await this.#usePasted(pasted)) ?? '')
			: m.ownImageErrors.clipboardEmpty;
	}

	async #pasteIntoForm(pasted: PastedImage): Promise<void> {
		this.pasteError = '';
		if ('file' in pasted) {
			this.pasteError = ownImageFileError(pasted.file) ?? '';
			if (this.pasteError) return;
		}
		if (this.#image()) {
			this.pendingPaste = pasted;
			this.replaceOpen = true;
			return;
		}
		this.pasteError = (await this.#usePasted(pasted)) ?? '';
	}

	async replaceImage(): Promise<void> {
		const pasted = this.pendingPaste;
		this.replaceOpen = false;
		if (pasted) this.pasteError = (await this.#usePasted(pasted)) ?? '';
	}

	handlePaste(event: ClipboardEvent): void {
		const { target, clipboardData } = event;
		if (!clipboardData || event.defaultPrevented || this.searchOpen || this.replaceOpen) return;
		if (target instanceof Element) {
			if (target.closest(SHORTCUT_TARGETS)) return;
			if (target instanceof HTMLElement && target.isContentEditable) return;
			if (!this.dialogOpen && target.closest('dialog')) return;
		}
		const pasted = pastedImageFrom(contentFromPasteEvent(clipboardData));
		if (!pasted) return;
		event.preventDefault();
		if (!this.dialogOpen) {
			void this.#pasteIntoForm(pasted);
			return;
		}
		this.fileError = '';
		void this.#usePasted(pasted).then((error) => {
			this.fileError = error ?? '';
		});
	}

	async useUrl(): Promise<void> {
		const parsed = parseImageUrl(this.urlText);
		if ('error' in parsed) {
			this.urlError = parsed.error;
			return;
		}
		this.urlError = '';
		this.loadingUrl = true;
		try {
			const size = await readImageSize(parsed.url);
			if (this.dialogOpen) this.#useImage({ kind: 'url', url: parsed.url, ...size });
		} catch {
			this.urlError = m.ownImageErrors.urlUnreadable;
		} finally {
			this.loadingUrl = false;
		}
	}

	useUrlOnEnter(event: KeyboardEvent): void {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		void this.useUrl();
	}
}
