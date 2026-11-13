import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import AuthorSortField from './AuthorSortField.svelte';
import type { AuthorFormState } from '#lib/values/types/author-form-state.ts';

function author(sortName = ''): AuthorFormState {
	return {
		image: null,
		birthYear: '',
		birthBeforeCommonEra: false,
		deathYear: '',
		deathBeforeCommonEra: false,
		yearsApproximate: false,
		sortByOther: sortName !== '',
		sortName,
		country: '',
		relations: []
	};
}

describe('AuthorSortField', () => {
	it('shows the sort name only once sorting by another name is ticked', async () => {
		const state = $state(author());
		render(AuthorSortField, { author: state });
		const sortName = page.getByRole('textbox', { name: m.valueForm.sortName });

		await expect.element(sortName).not.toBeInTheDocument();

		await page.getByText(m.valueForm.sortByOther).click();

		await expect.element(sortName).toBeVisible();
		await expect.element(page.getByText(m.valueForm.sortNameHint)).toBeVisible();
		expect(state.sortByOther).toBe(true);
	});

	it('fills the sort name of an author that has one', async () => {
		render(AuthorSortField, { author: author('Vinci, Leonardo da') });

		await expect
			.element(page.getByRole('textbox', { name: m.valueForm.sortName }))
			.toHaveValue('Vinci, Leonardo da');
	});
});
