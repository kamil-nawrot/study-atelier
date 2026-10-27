import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SIGNED_URL_SECONDS } from '#lib/images/bucket/bucket.ts';
import { ResolvedImages, SIGNED_URLS_KEY } from './resolved-images.ts';

const stored = new Map<string, string>();

beforeEach(() => {
	stored.clear();
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => stored.get(key) ?? null,
		setItem: (key: string, value: string) => stored.set(key, value),
		removeItem: (key: string) => stored.delete(key)
	});
});

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

	it('keeps the signed urls of the learner for the next visit on this device', () => {
		const first = new ResolvedImages();
		first.forLearner('learner-1', 1000);
		first.rememberSignedUrls(new Map([['learner-1/own.jpg', 'https://example.com/signed']]), 1000);

		const next = new ResolvedImages();
		next.forLearner('learner-1', 2000);

		expect(next.signedUrl('learner-1/own.jpg', 2000)?.url).toBe('https://example.com/signed');
	});

	it('drops the expired urls when it loads them', () => {
		const first = new ResolvedImages();
		first.forLearner('learner-1', 1000);
		first.rememberSignedUrls(new Map([['learner-1/own.jpg', 'https://example.com/signed']]), 1000);

		const later = new ResolvedImages();
		later.forLearner('learner-1', 1000 + SIGNED_URL_SECONDS * 1000);

		expect(later.signedUrl('learner-1/own.jpg', 1000)).toBeUndefined();
		expect(stored.get(SIGNED_URLS_KEY)).toBe(JSON.stringify({ learner: 'learner-1', urls: {} }));
	});

	it('forgets the urls on signing out and never gives them to another learner', () => {
		const images = new ResolvedImages();
		images.forLearner('learner-1', 1000);
		images.rememberSignedUrls(new Map([['learner-1/own.jpg', 'https://example.com/signed']]), 1000);

		const other = new ResolvedImages();
		other.forLearner('learner-2', 2000);
		expect(other.signedUrl('learner-1/own.jpg', 2000)).toBeUndefined();
		expect(stored.has(SIGNED_URLS_KEY)).toBe(false);

		images.forLearner(undefined, 2000);
		expect(images.signedUrl('learner-1/own.jpg', 2000)).toBeUndefined();
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
