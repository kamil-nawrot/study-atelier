import { saveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import type { Exhibition } from '#lib/exhibitions/types/exhibition.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import type { SaveStatus } from '#lib/exhibitions/types/save-status.ts';

export const AUTOSAVE_DELAY_MS = 3000;
export const RETRY_DELAY_MS = 10000;

export class ExhibitionSession {
	title = $state('');
	status = $state<SaveStatus>('saved');
	error = $state<string>();
	#id: string;
	#revision: number;
	#document: ExhibitionDocument;
	#dirty = false;
	#saving = false;
	#timer: ReturnType<typeof setTimeout> | undefined;

	constructor(exhibition: Exhibition) {
		this.#id = exhibition.id;
		this.#revision = exhibition.revision;
		this.#document = exhibition.document;
		this.title = exhibition.title;
	}

	get document(): ExhibitionDocument {
		return this.#document;
	}

	get dirty(): boolean {
		return this.#dirty || this.#saving;
	}

	rename(title: string): void {
		this.title = title;
		this.#changed();
	}

	replace(document: ExhibitionDocument): void {
		this.#document = document;
		this.#changed();
	}

	#changed(): void {
		if (this.status === 'conflict') return;
		this.#dirty = true;
		this.status = 'saving';
		this.#schedule(AUTOSAVE_DELAY_MS);
	}

	#schedule(delay: number): void {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => void this.flush(), delay);
	}

	async flush(): Promise<void> {
		clearTimeout(this.#timer);
		if (this.#saving || !this.#dirty || this.status === 'conflict') return;
		this.#saving = true;
		this.#dirty = false;
		const result = await saveExhibition(this.#id, this.title, this.#document, this.#revision);
		this.#saving = false;
		if (result.conflict) {
			this.status = 'conflict';
			this.#dirty = false;
			return;
		}
		if (result.revision === undefined) {
			this.#dirty = true;
			this.status = 'failed';
			this.error = result.error;
			this.#schedule(RETRY_DELAY_MS);
			return;
		}
		this.#revision = result.revision;
		this.error = undefined;
		if (this.#dirty) this.#schedule(AUTOSAVE_DELAY_MS);
		else this.status = 'saved';
	}

	destroy(): void {
		clearTimeout(this.#timer);
	}
}
