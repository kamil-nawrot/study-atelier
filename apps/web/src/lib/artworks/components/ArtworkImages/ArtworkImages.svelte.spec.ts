import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { findImageCandidates } from '#lib/images/image-search/image-search.ts';
import { autoFetch } from '#lib/profile/auto-fetch/auto-fetch.svelte.ts';
import { AUTO_MATCH_DELAY_MS } from '#lib/images/auto-match/auto-match.ts';
import type { ImageFieldTexts } from '#lib/images/types/image-field-texts.ts';
import ArtworkImages from './ArtworkImages.svelte';

vi.mock('#lib/images/image-search/image-search.ts', () => ({ findImageCandidates: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const texts: ImageFieldTexts = {
	label: m.artworkForm.image,
	find: m.artworkForm.findImage,
	findOther: m.artworkForm.chooseOtherImage,
	findHint: m.artworkForm.findImageHint,
	own: m.artworkForm.ownImage,
	changeOwn: m.artworkForm.changeOwnImage,
	ownTitle: m.artworkForm.ownImageTitle,
	changeOwnTitle: m.artworkForm.changeOwnImageTitle,
	remove: m.artworkForm.removeImage
};

const search = vi.mocked(findImageCandidates);

function renderImages(autoMatch = true): void {
	render(ArtworkImages, {
		alt: 'Artwork',
		searchReady: true,
		query: { kind: 'artwork', title: 'The Night Watch', authors: ['Rembrandt'] },
		texts,
		image: null,
		images: [],
		autoMatch
	});
}

describe('ArtworkImages automatic match', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		search.mockResolvedValue({ candidates: [], authorMatch: true });
		autoFetch.image = true;
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		autoFetch.image = true;
		vi.useRealTimers();
	});

	it('looks for the image of a new artwork once the learner stops typing', async () => {
		renderImages();

		await vi.advanceTimersByTimeAsync(AUTO_MATCH_DELAY_MS + 100);

		expect(search).toHaveBeenCalledTimes(1);
	});

	it('does not look for the image when the learner switched it off', async () => {
		autoFetch.image = false;
		renderImages();

		await vi.advanceTimersByTimeAsync(AUTO_MATCH_DELAY_MS + 100);

		expect(search).not.toHaveBeenCalled();
		await expect.element(page.getByRole('button', { name: m.artworkForm.findImage })).toBeEnabled();
	});

	it('does not look for the image of an artwork that is already saved', async () => {
		renderImages(false);

		await vi.advanceTimersByTimeAsync(AUTO_MATCH_DELAY_MS + 100);

		expect(search).not.toHaveBeenCalled();
	});
});
