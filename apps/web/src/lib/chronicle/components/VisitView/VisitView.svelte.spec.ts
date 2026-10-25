import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
import VisitView from './VisitView.svelte';

describe('VisitView', () => {
	it('shows the ticket, the note and the artworks seen', async () => {
		render(VisitView, {
			visit: testVisit(),
			artworks: [testArtwork(1, 'Water Lilies'), testArtwork(2, 'The Dance Class')]
		});

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Musée d’Orsay');
		await expect.element(page.getByText('Lilie wodne w owalnej sali.')).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: m.chronicle.view.seenTitle }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.atelier.count(2), { exact: true })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /Water Lilies/ })).toBeInTheDocument();
	});

	it('says how to add artworks to a visit without them and leaves out an empty note', async () => {
		render(VisitView, { visit: testVisit({ notes: '' }), artworks: [] });

		await expect.element(page.getByText(m.chronicle.view.noArtworks)).toBeInTheDocument();
		await expect.element(page.getByLabelText(m.chronicle.view.notesTitle)).not.toBeInTheDocument();
	});
});
