import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import { paletteOf } from '#lib/images/image-palette/image-palette.ts';
import { PaletteLoader } from './palette-loader.svelte.ts';

vi.mock('#lib/images/image-palette/image-palette.ts', () => ({ paletteOf: vi.fn() }));

const image: ArtworkImageInput = {
	id: 'image-1',
	kind: 'url',
	url: 'https://a.test/a.jpg',
	width: 4,
	height: 3
};
const colours = [{ color: '#aa8855', share: 1 }];

describe('PaletteLoader', () => {
	beforeEach(() => vi.mocked(paletteOf).mockReset());

	it('starts idle', () => {
		const loader = new PaletteLoader();

		expect(loader.status).toBe('idle');
		expect(loader.colours).toEqual([]);
	});

	it('is loading until the colours arrive', async () => {
		vi.mocked(paletteOf).mockResolvedValue({ colours });
		const loader = new PaletteLoader();

		const loading = loader.load(image);
		expect(loader.status).toBe('loading');
		await loading;

		expect(loader.status).toBe('ready');
		expect(loader.colours).toEqual(colours);
	});

	it('reports an image whose pixels cannot be read', async () => {
		vi.mocked(paletteOf).mockResolvedValue({ unreadable: true });
		const loader = new PaletteLoader();

		await loader.load(image);

		expect(loader.status).toBe('unreadable');
		expect(loader.colours).toEqual([]);
	});

	it('goes idle without an image', async () => {
		vi.mocked(paletteOf).mockResolvedValue({ colours });
		const loader = new PaletteLoader();
		await loader.load(image);

		await loader.load(null);

		expect(loader.status).toBe('idle');
		expect(loader.colours).toEqual([]);
	});

	it('keeps the answer for the image asked last', async () => {
		let release: (value: { colours: typeof colours }) => void = () => {};
		vi.mocked(paletteOf)
			.mockReturnValueOnce(new Promise((resolve) => (release = resolve)))
			.mockResolvedValueOnce({ unreadable: true });
		const loader = new PaletteLoader();

		const first = loader.load(image);
		await loader.load({ ...image, id: 'image-2' });
		release({ colours });
		await first;

		expect(loader.status).toBe('unreadable');
	});
});
