import { strToU8, Zip, ZipDeflate, ZipPassThrough } from 'fflate';
import {
	DATA_FILE,
	FORMAT_NAME,
	FORMAT_VERSION,
	imageEntryName,
	type AtelierData,
	type AtelierFile
} from './format.ts';

export type ArchiveImage = { path: string; bytes: Uint8Array };

export function atelierFile(data: AtelierData, now: Date): AtelierFile {
	return { format: FORMAT_NAME, version: FORMAT_VERSION, exportedAt: now.toISOString(), data };
}

export class ArchiveBuilder {
	#chunks: Uint8Array<ArrayBuffer>[] = [];
	#zip: Zip;
	#failure: Error | null = null;

	constructor() {
		this.#zip = new Zip((error, chunk) => {
			if (error) this.#failure = error;
			else this.#chunks.push(chunk as Uint8Array<ArrayBuffer>);
		});
	}

	addJson(file: AtelierFile): void {
		const entry = new ZipDeflate(DATA_FILE, { level: 6 });
		this.#zip.add(entry);
		entry.push(strToU8(JSON.stringify(file)), true);
	}

	addImage(image: ArchiveImage): void {
		const entry = new ZipPassThrough(imageEntryName(image.path));
		this.#zip.add(entry);
		entry.push(image.bytes, true);
	}

	finish(): Blob {
		this.#zip.end();
		if (this.#failure) throw this.#failure;
		return new Blob(this.#chunks, { type: 'application/zip' });
	}
}
