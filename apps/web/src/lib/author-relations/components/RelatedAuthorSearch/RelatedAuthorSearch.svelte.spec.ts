import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { RelatedAuthor } from '#lib/author-relations/types/related-author.ts';
import RelatedAuthorSearch from './RelatedAuthorSearch.svelte';

const authors = Array.from({ length: 10 }, (_, index) => ({
	id: `author-${index}`,
	name: `Łukasz ${index}`,
	count: 3
}));

function search(author: RelatedAuthor | null = null): { author: () => RelatedAuthor | null } {
	const props = $state({ author, authors, excluded: new Set(['author-0']) });
	render(RelatedAuthorSearch, props);
	return { author: () => props.author };
}

describe('RelatedAuthorSearch', () => {
	it('shows eight matches without diacritics and keeps only the id and name of the picked one', async () => {
		const { author } = search();

		await userEvent.fill(page.getByRole('combobox', { name: m.authorRelations.search }), 'lukasz');

		await expect.element(page.getByRole('option', { name: 'Łukasz 1' })).toBeVisible();
		expect(page.getByRole('option').elements()).toHaveLength(8);
		await userEvent.fill(
			page.getByRole('combobox', { name: m.authorRelations.search }),
			'lukasz 1'
		);
		await userEvent.click(page.getByRole('option', { name: 'Łukasz 1' }));

		await expect
			.element(page.getByRole('button', { name: m.ui.valueField.remove('Łukasz 1') }))
			.toBeVisible();
		expect(author()).toEqual({ id: 'author-1', name: 'Łukasz 1' });
	});

	it('says when no author matches', async () => {
		search();

		await userEvent.fill(page.getByRole('combobox', { name: m.authorRelations.search }), 'zz');

		await expect.element(page.getByText(m.authorRelations.noMatch)).toBeVisible();
	});
});
