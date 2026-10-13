import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shows the title, lead and content and sets the document title', async () => {
		render(AuthLayout, {
			title: 'Page title',
			lead: 'Short lead.',
			children: textSnippet('p', 'Form content')
		});

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Page title');
		await expect.element(page.getByText('Short lead.')).toBeVisible();
		await expect.element(page.getByText('Form content')).toBeVisible();
		await expect
			.element(page.getByRole('main').getByRole('img', { name: m.app.name }))
			.toBeVisible();
		await vi.waitFor(() => expect(document.title).toBe(m.app.pageTitle('Page title')));
	});

	it('presents an artwork with its caption and credit', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const [artwork] = authArtworks;

		render(AuthLayout, { title: 'Title', lead: 'Lead', children: textSnippet('p', 'Content') });

		const image = page.getByRole('img', { name: `${artwork.title}, ${artwork.artist}` });
		await expect.element(image).toHaveAttribute('src', expect.stringContaining('width=1280'));
		const caption = page.getByRole('figure');
		await expect.element(caption).toHaveTextContent(artwork.title);
		await expect.element(caption).toHaveTextContent(`${artwork.artist}, ${artwork.date}`);
		await expect.element(caption).toHaveTextContent(artwork.credit);
		await expect.element(page.getByRole('img', { name: m.app.name })).toBeVisible();
		expect(page.getByRole('img').elements()).toHaveLength(2);
	});

	it('shows only the background behind the caption on a phone', async () => {
		await page.viewport(390, 844);
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const [artwork] = authArtworks;

		render(AuthLayout, { title: 'Title', lead: 'Lead', children: textSnippet('p', 'Content') });

		await expect.element(page.getByRole('figure')).toHaveTextContent(artwork.title);
		await expect
			.element(page.getByAltText(`${artwork.title}, ${artwork.artist}`))
			.not.toBeVisible();
	});

	it('leaves out the footer when none is given', async () => {
		render(AuthLayout, { title: 'Title', lead: 'Lead', children: textSnippet('p', 'Content') });

		await expect.element(page.getByRole('main')).toBeVisible();
		expect(page.getByRole('main').element().querySelector('footer')).toBeNull();
	});

	it('renders the footer when given', async () => {
		render(AuthLayout, {
			title: 'Title',
			lead: 'Lead',
			children: textSnippet('p', 'Content'),
			footer: textSnippet('a', 'Footer')
		});

		const footer = page.getByRole('main').element().querySelector('footer');
		expect(footer).toHaveTextContent('Footer');
	});
});
