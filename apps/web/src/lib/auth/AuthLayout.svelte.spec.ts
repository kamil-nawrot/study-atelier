import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { authArtworks } from '#lib/artworks/auth-artworks.ts';
import { m } from '#lib/i18n/index.ts';
import AuthLayout from './AuthLayout.svelte';

function textSnippet(tag: string, text: string): ReturnType<typeof createRawSnippet> {
	return createRawSnippet(() => ({ render: () => `<${tag}>${text}</${tag}>` }));
}

describe('AuthLayout', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shows the title, lead and content and sets the document title', async () => {
		render(AuthLayout, {
			title: 'Tytuł strony',
			lead: 'Krótki wstęp.',
			children: textSnippet('p', 'Treść formularza')
		});

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Tytuł strony');
		await expect.element(page.getByText('Krótki wstęp.')).toBeVisible();
		await expect.element(page.getByText('Treść formularza')).toBeVisible();
		await expect.element(page.getByRole('main')).toHaveTextContent(m.app.name);
		await vi.waitFor(() => expect(document.title).toBe(`Tytuł strony · ${m.app.name}`));
	});

	it('presents an artwork with its caption and credit', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const [artwork] = authArtworks;

		render(AuthLayout, { title: 'Tytuł', lead: 'Wstęp', children: textSnippet('p', 'Treść') });

		const image = page.getByRole('img', { name: `${artwork.title}, ${artwork.artist}` });
		await expect.element(image).toHaveAttribute('src', expect.stringContaining('width=1280'));
		const caption = page.getByRole('figure');
		await expect.element(caption).toHaveTextContent(artwork.title);
		await expect.element(caption).toHaveTextContent(`${artwork.artist}, ${artwork.date}`);
		await expect.element(caption).toHaveTextContent(m.artwork.credit);
		expect(page.getByRole('img').elements()).toHaveLength(1);
	});

	it('leaves out the footer when none is given', async () => {
		render(AuthLayout, { title: 'Tytuł', lead: 'Wstęp', children: textSnippet('p', 'Treść') });

		await expect.element(page.getByRole('main')).toBeVisible();
		expect(page.getByRole('main').element().querySelector('footer')).toBeNull();
	});

	it('renders the footer when given', async () => {
		render(AuthLayout, {
			title: 'Tytuł',
			lead: 'Wstęp',
			children: textSnippet('p', 'Treść'),
			footer: textSnippet('a', 'Stopka')
		});

		const footer = page.getByRole('main').element().querySelector('footer');
		expect(footer).toHaveTextContent('Stopka');
	});
});
