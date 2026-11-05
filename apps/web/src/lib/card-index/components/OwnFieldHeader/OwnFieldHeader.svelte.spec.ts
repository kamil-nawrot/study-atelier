import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnFieldHeader from './OwnFieldHeader.svelte';

describe('OwnFieldHeader', () => {
	it('names the kind, the description and every type of a limited field', async () => {
		const [, motifs] = testOwnFields();
		render(OwnFieldHeader, { field: { ...motifs, typeCodes: ['painting', 'drawing'] } });

		await expect.element(page.getByRole('heading', { level: 1, name: 'Motifs' })).toBeVisible();
		await expect
			.element(page.getByText('Własne pole · Lista, kilka wartości · 3 dzieła'))
			.toBeVisible();
		await expect.element(page.getByText('What the artwork shows')).toBeVisible();
		await expect.element(page.getByText(m.artworkTypes.painting)).toBeVisible();
		await expect.element(page.getByText(m.artworkTypes.drawing)).toBeVisible();
		await expect.element(page.getByText(m.ownFields.page.allTypes)).not.toBeInTheDocument();
	});

	it('says a field applies to all types and shows a failure', async () => {
		const [, , seen] = testOwnFields();
		render(OwnFieldHeader, { field: seen, failure: 'No connection' });

		await expect.element(page.getByText('Własne pole · Zaznaczenie · 0 dzieł')).toBeVisible();
		await expect.element(page.getByText(m.ownFields.page.allTypes)).toBeVisible();
		await expect.element(page.getByText('No connection')).toBeVisible();
	});
});
