import { saveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import type { Exhibition } from '#lib/exhibitions/types/exhibition.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import type { SaveStatus } from '#lib/exhibitions/types/save-status.ts';

export const AUTOSAVE_DELAY_MS = 3000;
export const RETRY_DELAY_MS = 10000;

export class ExhibitionSession {
	title = $state('');
	savedTitle = $state('');
	status = $state<SaveStatus>('saved');
	error = $state<string>();
	#id: string;
	#revision: number;
	#document: ExhibitionDocument;
	#dirty = false;
	#saving = false;
	#running: Promise<void> | undefined;
	#stopped = false;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(exhibition: Exhibition) {
		this.#id = exhibition.id;
		this.#revision = exhibition.revision;
		this.#document = exhibition.document;
		this.title = exhibition.title;
		this.savedTitle = exhibition.title;
	}

	get document(): ExhibitionDocument {
		return this.#document;
	}

	get dirty(): boolean {
		return this.#dirty || this.#saving;
	}

	get unsaved(): boolean {
		return this.#dirty && (this.status === 'failed' || this.status === 'rejected');
	}

	rename(title: string): void {
		this.title = title;
		if (title.trim() === '') {
			clearTimeout(this.#timer);
			this.status = 'untitled';
			return;
		}
		this.savedTitle = title.trim();
		this.#changed();
	}

	keepTitle(): void {
		if (this.title.trim() !== '') return;
		this.title = this.savedTitle;
		this.#changed();
	}

	replace(document: ExhibitionDocument): void {
		this.#document = document;
		this.#changed();
	}

	#changed(): void {
		if (this.status === 'conflict') return;
		if (this.title.trim() === '') {
			this.#dirty = true;
			this.status = 'untitled';
			return;
		}
		this.#dirty = true;
		this.status = 'saving';
		this.#schedule(AUTOSAVE_DELAY_MS);
	}

	#schedule(delay: number): void {
		clearTimeout(this.#timer);
		if (this.#stopped) return;
		this.#timer = setTimeout(() => void this.flush(), delay);
	}

	async flush(): Promise<void> {
		clearTimeout(this.#timer);
		if (this.#running) {
			await this.#running;
			clearTimeout(this.#timer);
		}
		if (this.#saving || !this.#dirty || this.status === 'conflict') return;
		if (this.title.trim() === '') {
			this.status = 'untitled';
			return;
		}
		this.#saving = true;
		this.#dirty = false;
		const running = saveExhibition(this.#id, this.title, this.#document, this.#revision);
		this.#running = running.then(
			() => undefined,
			() => undefined
		);
		const result = await running;
		this.#saving = false;
		this.#running = undefined;
		if (result.conflict) {
			this.status = 'conflict';
			this.#dirty = false;
			return;
		}
		if (result.revision === undefined) {
			this.#dirty = true;
			this.status = result.rejected ? 'rejected' : 'failed';
			this.error = result.error;
			if (!result.rejected) this.#schedule(RETRY_DELAY_MS);
			return;
		}
		this.#revision = result.revision;
		this.error = undefined;
		if (!this.#dirty) this.status = 'saved';
		else if (this.#stopped) void this.flush();
		else this.#schedule(AUTOSAVE_DELAY_MS);
	}

	destroy(): void {
		this.#stopped = true;
		clearTimeout(this.#timer);
	}
}
