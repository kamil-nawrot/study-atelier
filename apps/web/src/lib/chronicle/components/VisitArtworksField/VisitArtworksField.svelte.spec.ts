import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { emptyVisitForm } from '#lib/chronicle/visit-form/visit-form.ts';
import VisitArtworksField from './VisitArtworksField.svelte';
import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

const lilies = testArtwork(1, 'Water Lilies', { location: 'Orsay' });
const kiss = testArtwork(2, 'The Kiss', { location: 'Belvedere', authors: ['Gustav Klimt'] });
const artworks = [lilies, kiss];

function form(overrides: Partial<VisitFormState> = {}): VisitFormState {
	return { ...emptyVisitForm(), ...overrides };
}

describe('VisitArtworksField', () => {
	it('asks for a place first', async () => {
		render(VisitArtworksField, { form: form(), artworks, isNew: true });

		await expect.element(page.getByText(m.chronicle.form.noPlace)).toBeInTheDocument();
	});

	it('says when the collection has nothing from the place', async () => {
		render(VisitArtworksField, { form: form({ place: ['Uffizi'] }), artworks, isNew: true });

		await expect.element(page.getByText(m.chronicle.form.placeEmpty)).toBeInTheDocument();
	});

	it('shows the artworks of the place with their ticks and the hint for a new visit', async () => {
		render(VisitArtworksField, {
			form: form({ place: ['Orsay'], chosen: [lilies.id] }),
			artworks,
			isNew: true
		});

		await expect
			.element(page.getByRole('group', { name: m.chronicle.form.fromPlace }))
			.toBeVisible();
		await expect.element(page.getByText(m.chronicle.form.ticked)).toBeInTheDocument();
		const box = page.getByRole('checkbox', { name: 'Water Lilies' });
		await expect.element(box).toBeChecked();

		await userEvent.click(page.getByText('Water Lilies'));

		await expect.element(box).not.toBeChecked();
	});

	it('adds an artwork from the search to the other places', async () => {
		render(VisitArtworksField, {
			form: form({ place: ['Orsay'], chosen: [lilies.id] }),
			artworks,
			isNew: false
		});

		await expect.element(page.getByText(m.chronicle.form.ticked)).not.toBeInTheDocument();
		await page.getByRole('searchbox', { name: m.chronicle.form.search }).fill('klimt');
		await userEvent.click(
			page.getByRole('button', { name: m.chronicle.form.addArtwork('The Kiss') })
		);

		const elsewhere = page.getByRole('group', { name: m.chronicle.form.fromElsewhere });
		await expect.element(elsewhere.getByRole('checkbox', { name: 'The Kiss' })).toBeChecked();
		await expect.element(page.getByRole('searchbox')).toHaveValue('');
	});

	it('says when the search finds nothing', async () => {
		render(VisitArtworksField, { form: form({ place: ['Orsay'] }), artworks, isNew: true });

		await page.getByRole('searchbox', { name: m.chronicle.form.search }).fill('water');

		await expect.element(page.getByText(m.chronicle.form.noMatch)).toBeInTheDocument();
	});
});
