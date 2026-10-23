import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import {
	artworkImageCredit,
	artworkImageSource,
	artworkLargeSource,
	isTooLargeForLoupe
} from './artwork-image.ts';
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

describe('artworkLargeSource', () => {
	it('takes the original file from Commons', () => {
		expect(artworkLargeSource(commons)).toEqual({
			src: 'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Milkmaid.jpg',
			width: 1000
		});
	});

	it('takes an upload in its stored size and a link as it is', () => {
		expect(
			artworkLargeSource({
				kind: 'upload',
				path: 'u/a.jpg',
				previewUrl: 'https://example.com/signed.jpg',
				width: 3200,
				height: 2400
			})
		).toEqual({ src: 'https://example.com/signed.jpg', width: 3200 });
		expect(
			artworkLargeSource({ kind: 'url', url: 'https://example.com/a.jpg', width: 900, height: 600 })
		).toEqual({ src: 'https://example.com/a.jpg', width: 900 });
	});

	it('caps the large version of a big Commons file at 3840 px', () => {
		expect(artworkLargeSource({ ...commons, width: 44567, height: 35291 })).toEqual({
			src: 'https://commons.wikimedia.org/wiki/Special:FilePath/The%20Milkmaid.jpg?width=3840',
			width: 3840
		});
	});

	it('takes a thumbnail of a link to a Commons file and drops its query', () => {
		const url =
			'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg?utm_source=pl.wikipedia.org&amp;utm_campaign=imageinfo';
		const linked: ArtworkImageInput = { kind: 'url', url, width: 12051, height: 8442 };
		expect(artworkLargeSource(linked)).toEqual({
			src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/3840px-Colosseo_2020.jpg',
			width: 3840
		});
		expect(artworkImageSource(linked, 800)?.src).toBe(
			'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/960px-Colosseo_2020.jpg'
		);
		expect(artworkImageSource(linked, 800)?.srcset).toContain(
			'/thumb/d/de/Colosseo_2020.jpg/250px-Colosseo_2020.jpg 250w'
		);
		expect(artworkImageSource({ ...linked, width: 700, height: 500 }, 800)?.src).toBe(
			'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg'
		);
		expect(isTooLargeForLoupe(linked)).toBe(false);
	});

	it('offers thumbnails up to 3840 px and never the original of a big linked Commons file', () => {
		const url = 'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg';
		const srcset = artworkImageSource(
			{ kind: 'url', url, width: 12051, height: 8442 },
			1920
		)?.srcset;
		expect(srcset).toContain('/3840px-Colosseo_2020.jpg 3840w');
		expect(srcset).not.toContain(`${url} `);
		expect(srcset).not.toContain('12051w');
	});

	it('offers the original of a linked Commons file that is not wider than 3840 px', () => {
		const url = 'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg';
		const srcset = artworkImageSource({ kind: 'url', url, width: 2400, height: 1600 }, 960)?.srcset;
		expect(srcset).toContain(`${url} 2400w`);
		expect(srcset).toContain('/1920px-Colosseo_2020.jpg 1920w');
		expect(srcset).not.toContain('3840w');
	});

	it('does not offer the loupe for a big image from another link', () => {
		const big: ArtworkImageInput = {
			kind: 'url',
			url: 'https://example.com/a.jpg',
			width: 9000,
			height: 6000
		};
		expect(isTooLargeForLoupe(big)).toBe(true);
		expect(artworkLargeSource(big)).toBeUndefined();
		expect(isTooLargeForLoupe({ ...big, width: 4000, height: 3000 })).toBe(false);
		expect(isTooLargeForLoupe(commons)).toBe(false);
	});

	it('has no large version without a stored width', () => {
		expect(artworkLargeSource({ ...commons, width: null })).toBeUndefined();
		expect(artworkLargeSource(null)).toBeUndefined();
	});
});
