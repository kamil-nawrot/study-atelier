import { describe, expect, it } from 'vitest';
import { SIGNED_URL_SECONDS } from '#lib/images/bucket/bucket.ts';
import { ResolvedImages } from './resolved-images.ts';

describe('ResolvedImages', () => {
	it('remembers the thumbnail of each Commons file', () => {
		const images = new ResolvedImages();

		images.rememberThumbnails(new Map([['A.jpg', 'https://example.com/a.jpg']]));

		expect(images.thumbnail('A.jpg')).toBe('https://example.com/a.jpg');
		expect(images.thumbnail('B.jpg')).toBeUndefined();
	});

	it('gives a signed url back only until it expires', () => {
		const images = new ResolvedImages();
		const lifetime = SIGNED_URL_SECONDS * 1000;

		images.rememberSignedUrls(new Map([['owner/own.jpg', 'https://example.com/signed']]), 1000);

		expect(images.signedUrl('owner/own.jpg', 1000 + lifetime - 1)).toEqual({
			url: 'https://example.com/signed',
			signedAt: 1000
		});
		expect(images.signedUrl('owner/own.jpg', 1000 + lifetime)).toBeUndefined();
	});

	it('replaces a signed url with a newer one', () => {
		const images = new ResolvedImages();

		images.rememberSignedUrls(new Map([['owner/own.jpg', 'https://example.com/old']]), 1000);
		images.rememberSignedUrls(new Map([['owner/own.jpg', 'https://example.com/new']]), 2000);

		expect(images.signedUrl('owner/own.jpg', 2000)?.url).toBe('https://example.com/new');
	});

	it('forgets everything when cleared', () => {
		const images = new ResolvedImages();
		images.rememberThumbnails(new Map([['A.jpg', 'https://example.com/a.jpg']]));
		images.rememberSignedUrls(new Map([['owner/own.jpg', 'https://example.com/signed']]), 1000);

		images.clear();

		expect(images.thumbnail('A.jpg')).toBeUndefined();
		expect(images.signedUrl('owner/own.jpg', 1000)).toBeUndefined();
	});
});
