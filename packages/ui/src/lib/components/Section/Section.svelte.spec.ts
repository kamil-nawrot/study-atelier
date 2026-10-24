import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Section from './Section.svelte';

const content = createRawSnippet(() => ({ render: () => '<h2>Details</h2>' }));

describe('Section', () => {
	it('is a section by default', async () => {
		render(Section, { children: content, 'aria-label': 'Artwork details' });

		await expect.element(page.getByRole('region', { name: 'Artwork details' })).toBeVisible();
	});

	it('shows its content', async () => {
		render(Section, { children: content });

		await expect.element(page.getByRole('heading', { name: 'Details' })).toBeVisible();
	});

	it('can be an article', async () => {
		render(Section, { as: 'article', children: content });

		await expect.element(page.getByRole('article')).toBeVisible();
	});

	it('can be an aside', async () => {
		render(Section, { as: 'aside', children: content });

		await expect.element(page.getByRole('complementary')).toBeVisible();
	});

	it('can be a plain div', async () => {
		render(Section, { as: 'div', children: content, 'data-kind': 'plain' });

		const element = page.getByRole('heading', { name: 'Details' }).element().parentElement;
		expect(element?.tagName).toBe('DIV');
		expect(element?.getAttribute('data-kind')).toBe('plain');
	});
});
