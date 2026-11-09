import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { PaletteColour } from '#lib/catalogue/types/palette-colour.ts';
import { paletteOf } from '#lib/images/image-palette/image-palette.ts';

type PaletteStatus = 'idle' | 'loading' | 'ready' | 'unreadable';

export class PaletteLoader {
	status = $state<PaletteStatus>('idle');
	colours = $state<PaletteColour[]>([]);
	#request = 0;

	async load(image: ArtworkImageInput | null | undefined): Promise<void> {
		const request = (this.#request += 1);
		if (!image) {
			this.status = 'idle';
			this.colours = [];
			return;
		}
		this.status = 'loading';
		this.colours = [];
		const result = await paletteOf(image);
		if (request !== this.#request) return;
		if ('colours' in result) {
			this.colours = result.colours;
			this.status = 'ready';
		} else {
			this.status = 'unreadable';
		}
	}
}
