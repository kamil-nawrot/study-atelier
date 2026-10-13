import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../messages';
import MessagesHost from '../testing/MessagesHost.svelte';
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
});
