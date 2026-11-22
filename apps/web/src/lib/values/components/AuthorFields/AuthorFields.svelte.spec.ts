import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { authorFormFromDetails, emptyAuthorDetails } from '#lib/values/author-form/author-form.ts';
import AuthorFields from './AuthorFields.svelte';

describe('AuthorFields', () => {
	it('asks for the life years, the country and the relations of an author', async () => {
		render(AuthorFields, {
			author: authorFormFromDetails(emptyAuthorDetails()),
			errors: {},
			authors: []
		});

		await expect.element(page.getByText(m.valueForm.lifeYears)).toBeVisible();
		await expect.element(page.getByLabelText(m.valueForm.authorCountry)).toBeVisible();
	});

	it('shows the error of a life year', async () => {
		render(AuthorFields, {
			author: authorFormFromDetails(emptyAuthorDetails()),
			errors: { deathYear: 'Rok jest za późny.' },
			authors: []
		});

		await expect.element(page.getByText('Rok jest za późny.')).toBeVisible();
	});
});
