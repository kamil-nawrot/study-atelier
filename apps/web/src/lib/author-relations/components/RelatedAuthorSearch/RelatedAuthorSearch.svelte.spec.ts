import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import RelatedAuthorSearch from './RelatedAuthorSearch.svelte';

const authors = Array.from({ length: 10 }, (_, index) => ({
	id: `author-${index}`,
	name: `Łukasz ${index}`
}));

describe('RelatedAuthorSearch', () => {
	it('shows nothing before a phrase is typed', async () => {
		render(RelatedAuthorSearch, { authors, excluded: new Set<string>(), onpick: vi.fn() });

		await expect
			.element(page.getByRole('searchbox', { name: m.authorRelations.search }))
			.toBeVisible();
		expect(page.getByRole('listitem').elements()).toHaveLength(0);
	});

	it('shows eight matches and passes on only the id and name of the picked one', async () => {
		const onpick = vi.fn();
		render(RelatedAuthorSearch, {
			authors: authors.map((author) => ({ ...author, count: 3 })),
			excluded: new Set(['author-0']),
			onpick
		});

		await userEvent.fill(page.getByRole('searchbox', { name: m.authorRelations.search }), 'lukasz');

		await expect.element(page.getByRole('button', { name: 'Łukasz 1' })).toBeVisible();
		expect(page.getByRole('listitem').elements()).toHaveLength(8);
		await userEvent.click(page.getByRole('button', { name: 'Łukasz 1' }));
		expect(onpick).toHaveBeenCalledWith({ id: 'author-1', name: 'Łukasz 1' });
	});
});
