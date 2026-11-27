import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { findImageCandidates } from '#lib/images/image-search/image-search.ts';
import { findSameArtworkImages } from '#lib/images/same-artwork/same-artwork.ts';
import type { ImageCandidate } from '#lib/images/types/image-candidate.ts';
import ImageSearchDialog from './ImageSearchDialog.svelte';

vi.mock('#lib/images/image-search/image-search.ts', () => ({ findImageCandidates: vi.fn() }));
vi.mock('#lib/images/same-artwork/same-artwork.ts', () => ({ findSameArtworkImages: vi.fn() }));

const search = vi.mocked(findImageCandidates);
const same = vi.mocked(findSameArtworkImages);

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function candidate(wikidataId: string, file: string, title = 'Mona Lisa'): ImageCandidate {
	return {
		wikidataId,
		title,
		authors: ['Leonardo da Vinci'],
		image: {
			file,
			src: PIXEL,
			srcset: '',
			width: 300,
			height: 400,
			licence: 'Public domain',
			licenceUrl: null,
			attribution: null
		}
	};
}

const query = { kind: 'artwork' as const, title: 'Mona Lisa', authors: ['Leonardo da Vinci'] };
const sameArtwork = {
	wikidataId: 'Q12418',
	file: 'Mona_Lisa.jpg',
	title: 'Mona Lisa',
	authors: ['Leonardo da Vinci']
};

describe('ImageSearchDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		search.mockResolvedValue({
			candidates: [
				candidate('Q12418', 'Mona_Lisa.jpg'),
				candidate('Q2', 'Prado.jpg', 'Kopia z Prado')
			],
			authorMatch: true
		});
	});

	it('shows only the candidates, without sections, when the main image is not from a match', async () => {
		render(ImageSearchDialog, { query, open: true, onpick: vi.fn() });

		await expect.element(page.getByText('Kopia z Prado')).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.imageSearch.sameArtwork }))
			.not.toBeInTheDocument();
		expect(same).not.toHaveBeenCalled();
	});

	it('shows the images of the same artwork first and the other artworks under their own heading', async () => {
		same.mockResolvedValue({
			candidates: [candidate('Q12418', 'Detail.jpg'), candidate('Q12418', 'Frame.jpg')],
			cursor: null
		});
		render(ImageSearchDialog, { query, sameArtwork, open: true, onpick: vi.fn() });

		const sameSection = page.getByRole('region', { name: m.imageSearch.sameArtwork });
		await expect.element(sameSection).toBeVisible();
		expect(sameSection.getByRole('button').elements()).toHaveLength(2);
		const others = page.getByRole('region', { name: m.imageSearch.otherArtworks });
		await expect.element(others.getByText('Kopia z Prado')).toBeVisible();
		expect(others.getByRole('button').elements()).toHaveLength(1);
		await expect
			.element(page.getByRole('button', { name: m.imageSearch.more }))
			.not.toBeInTheDocument();
	});

	it('picks one image of the same artwork with one click and closes', async () => {
		const onpick = vi.fn();
		same.mockResolvedValue({ candidates: [candidate('Q12418', 'Detail.jpg')], cursor: null });
		render(ImageSearchDialog, { query, sameArtwork, open: true, onpick });

		await page.getByRole('region', { name: m.imageSearch.sameArtwork }).getByRole('button').click();

		expect(onpick).toHaveBeenCalledWith(candidate('Q12418', 'Detail.jpg'));
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('loads the next images of the same artwork on request', async () => {
		same
			.mockResolvedValueOnce({
				candidates: [candidate('Q12418', 'One.jpg')],
				cursor: { category: 'Mona Lisa', next: 'file|two' }
			})
			.mockResolvedValueOnce({ candidates: [candidate('Q12418', 'Two.jpg')], cursor: null });
		render(ImageSearchDialog, { query, sameArtwork, open: true, onpick: vi.fn() });

		await page.getByRole('button', { name: m.imageSearch.more }).click();

		const sameSection = page.getByRole('region', { name: m.imageSearch.sameArtwork });
		await vi.waitFor(() => expect(sameSection.getByRole('button').elements()).toHaveLength(2));
		expect(same).toHaveBeenLastCalledWith(sameArtwork, { category: 'Mona Lisa', next: 'file|two' });
		await expect
			.element(page.getByRole('button', { name: m.imageSearch.more }))
			.not.toBeInTheDocument();
	});

	it('falls back to the candidates when the images of the same artwork cannot be read', async () => {
		same.mockRejectedValue(new Error('Commons is down'));
		render(ImageSearchDialog, { query, sameArtwork, open: true, onpick: vi.fn() });

		await expect.element(page.getByText('Kopia z Prado')).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.imageSearch.otherArtworks }))
			.not.toBeInTheDocument();
	});

	it('says nothing was found only when there are neither images of the artwork nor other artworks', async () => {
		search.mockResolvedValue({
			candidates: [candidate('Q12418', 'Mona_Lisa.jpg')],
			authorMatch: true
		});
		same.mockResolvedValue({ candidates: [], cursor: null });
		render(ImageSearchDialog, { query, sameArtwork, open: true, onpick: vi.fn() });

		await expect.element(page.getByText(m.imageSearch.empty)).toBeVisible();
	});
});
