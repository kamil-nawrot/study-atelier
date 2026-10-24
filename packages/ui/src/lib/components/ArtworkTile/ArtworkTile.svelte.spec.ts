import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import Landmark from '@lucide/svelte/icons/landmark';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import { defaultUiMessages } from '../../messages/messages';
import MessagesHost from '../../testing/MessagesHost.svelte';
import ArtworkTile from './ArtworkTile.svelte';

const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const image = { src: pixel, width: 400, height: 300 };
const base = {
	href: '/atelier/12',
	number: 12,
	title: 'Sunflowers',
	authors: ['Vincent van Gogh']
};

describe('ArtworkTile', () => {
	it('links to the artwork', async () => {
		render(ArtworkTile, base);

		await expect.element(page.getByRole('link')).toHaveAttribute('href', '/atelier/12');
	});

	it('shows the title, the author and the date', async () => {
		render(ArtworkTile, { ...base, date: '1888' });

		const link = page.getByRole('link');
		await expect.element(link).toHaveTextContent('Sunflowers');
		await expect.element(link).toHaveTextContent('Vincent van Gogh');
		await expect.element(link).toHaveTextContent('1888');
	});

	it('leaves the date out when there is none', async () => {
		render(ArtworkTile, base);

		await expect.element(page.getByRole('link')).not.toHaveTextContent('·');
	});

	it('lists several authors', async () => {
		render(ArtworkTile, { ...base, authors: ['Jan van Eyck', 'Hubert van Eyck'] });

		await expect.element(page.getByRole('link')).toHaveTextContent('Jan van Eyck, Hubert van Eyck');
	});

	it('says the author is unknown when there are none', async () => {
		render(ArtworkTile, { ...base, authors: [] });

		await expect.element(page.getByRole('link')).toHaveTextContent(defaultUiMessages.unknownAuthor);
	});

	it('uses its own text for an unknown author', async () => {
		render(ArtworkTile, { ...base, authors: [], unknownAuthorLabel: 'Anonymous' });

		await expect.element(page.getByRole('link')).toHaveTextContent('Anonymous');
	});

	it.each([
		[1, '#0001'],
		[12, '#0012'],
		[12345, '#12345']
	])('shows record number %i as %s', async (number, text) => {
		render(ArtworkTile, { ...base, number });

		await expect.element(page.getByText(text)).toBeVisible();
	});

	it('describes the image with the title and the author', async () => {
		render(ArtworkTile, { ...base, image });

		await expect
			.element(page.getByRole('img', { name: 'Sunflowers, Vincent van Gogh' }))
			.toBeInTheDocument();
	});

	it('shows the no-image mark when there is no image', async () => {
		render(ArtworkTile, base);

		await expect.element(page.getByRole('img', { name: defaultUiMessages.noImage })).toBeVisible();
	});

	it('uses its own text for the missing image', async () => {
		render(ArtworkTile, { ...base, noImageLabel: 'Brak zdjęcia' });

		await expect.element(page.getByRole('img', { name: 'Brak zdjęcia' })).toBeVisible();
	});

	it('says the image did not load when it is unavailable, not that there is none', async () => {
		render(ArtworkTile, { ...base, imageUnavailable: true });

		await expect.element(page.getByText(defaultUiMessages.imageFailed)).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: defaultUiMessages.noImage }))
			.not.toBeInTheDocument();
	});

	it('uses its own text for an unavailable image', async () => {
		render(ArtworkTile, {
			...base,
			imageUnavailable: true,
			imageUnavailableLabel: 'Brak połączenia'
		});

		await expect.element(page.getByText('Brak połączenia')).toBeVisible();
	});

	it('shows the mark with its label in the corner of the image', async () => {
		render(ArtworkTile, { ...base, mark: Landmark, markLabel: 'Antiquity' });

		await expect.element(page.getByRole('img', { name: 'Antiquity' })).toBeVisible();
	});

	it('shows no mark when there is none', async () => {
		const { container } = await render(ArtworkTile, base);

		expect(container.querySelector('.mark')).toBeNull();
	});

	it('uses the library texts set with setUiMessages', async () => {
		render(MessagesHost, {
			props: {
				component: ArtworkTile as never,
				props: { ...base, authors: [] },
				messages: { ...defaultUiMessages, unknownAuthor: 'Nieznany autor', noImage: 'Brak zdjęcia' }
			}
		});

		await expect.element(page.getByRole('link')).toHaveTextContent('Nieznany autor');
		await expect.element(page.getByRole('img', { name: 'Brak zdjęcia' })).toBeVisible();
	});

	it('waits for an image whose address is not known yet instead of saying there is none', async () => {
		const { container } = await render(ArtworkTile, {
			...base,
			image: { width: 400, height: 300 }
		});

		await expect.element(page.getByText(defaultUiMessages.noImage)).not.toBeInTheDocument();
		expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
	});

	describe('with a maximum image height', () => {
		afterEach(() => {
			document.documentElement.style.removeProperty('--artwork-max-height');
		});

		it('keeps a tall image within the height and in proportion', async () => {
			document.documentElement.style.setProperty('--artwork-max-height', '120px');
			render(ArtworkTile, { ...base, image: { src: pixel, width: 300, height: 900 } });

			const box = page
				.getByRole('img', { name: /Sunflowers/ })
				.element()
				.getBoundingClientRect();
			expect(box.height).toBeLessThanOrEqual(120);
			expect(box.width / box.height).toBeCloseTo(300 / 900, 1);
		});

		it('leaves an image that fits at the full width', async () => {
			document.documentElement.style.setProperty('--artwork-max-height', '2000px');
			render(ArtworkTile, { ...base, image });

			const box = page
				.getByRole('img', { name: /Sunflowers/ })
				.element()
				.getBoundingClientRect();
			const window = page
				.getByRole('img', { name: /Sunflowers/ })
				.element()
				.closest('.window');
			expect(box.width).toBeCloseTo(window!.getBoundingClientRect().width, 0);
		});
	});

	it('shows no heart without a handler', async () => {
		render(ArtworkTile, base);

		await expect.element(page.getByRole('button')).not.toBeInTheDocument();
	});

	it('shows the heart as a button beside the link, not inside it', async () => {
		const onfavourite = vi.fn();
		render(ArtworkTile, { ...base, favouriteLabel: 'Add to favourites', onfavourite });

		const heart = page.getByRole('button', { name: 'Add to favourites' });
		await expect.element(heart).toHaveAttribute('aria-pressed', 'false');
		await heart.click();

		expect(onfavourite).toHaveBeenCalledOnce();
		await expect.element(page.getByRole('link').getByRole('button')).not.toBeInTheDocument();
	});

	it('marks the heart as pressed for a favourite', async () => {
		render(ArtworkTile, {
			...base,
			favourite: true,
			favouriteLabel: 'Remove from favourites',
			onfavourite: vi.fn()
		});

		await expect
			.element(page.getByRole('button', { name: 'Remove from favourites' }))
			.toHaveAttribute('aria-pressed', 'true');
	});
});
