import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { artworkImageCredit, artworkImageSource } from './artwork-image.ts';
import type { ArtworkImageInput } from './types.ts';

const commons: ArtworkImageInput = {
	kind: 'commons',
	wikidataId: 'Q167605',
	file: 'The Milkmaid.jpg',
	licence: 'Public domain',
	licenceUrl: null,
	attribution: null,
	width: 1000,
	height: 1200
};

describe('artworkImageSource', () => {
	it('has no source without an image', () => {
		expect(artworkImageSource(null, 500)).toBeUndefined();
	});

	it('offers Commons widths up to the original width', () => {
		const source = artworkImageSource(commons, 500);

		expect(source?.src).toBe(
			'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Milkmaid.jpg?width=500'
		);
		expect(source?.srcset).toContain('960w');
		expect(source?.srcset).not.toContain('1280w');
		expect(source).toMatchObject({ width: 1000, height: 1200 });
	});

	it('offers every Commons width when the size is unknown', () => {
		const source = artworkImageSource({ ...commons, width: null, height: null }, 500);

		expect(source?.srcset).toContain('1920w');
		expect(source?.width).toBeUndefined();
	});

	it('uses the address of an image from a URL', () => {
		expect(
			artworkImageSource(
				{ kind: 'url', url: 'https://example.org/a.jpg', width: 4, height: 3 },
				500
			)
		).toEqual({ src: 'https://example.org/a.jpg', width: 4, height: 3 });
	});

	it('uses the signed URL of an uploaded image and has none without it', () => {
		const upload: ArtworkImageInput = { kind: 'upload', path: 'u/a.jpg', width: 4, height: 3 };

		expect(artworkImageSource(upload, 500)).toBeUndefined();
		expect(artworkImageSource({ ...upload, previewUrl: 'https://signed' }, 500)).toEqual({
			src: 'https://signed',
			width: 4,
			height: 3
		});
	});
});

describe('artworkImageCredit', () => {
	it('credits Commons, an image from a URL and an uploaded image', () => {
		expect(artworkImageCredit(null)).toBeUndefined();
		expect(artworkImageCredit(commons)).toBe(m.artwork.credit);
		expect(
			artworkImageCredit({ kind: 'url', url: 'https://example.org/a.jpg', width: 4, height: 3 })
		).toBe(m.artworkForm.ownImageUrlCredit('example.org'));
		expect(artworkImageCredit({ kind: 'upload', path: 'u/a.jpg', width: null, height: null })).toBe(
			m.artworkForm.ownImageCredit
		);
	});
});
