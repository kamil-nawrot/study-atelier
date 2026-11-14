import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testTrip, testVisit } from '#lib/testing/chronicle/chronicle.ts';
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
		await expect
			.element(page.getByText(m.atelier.count(2), { exact: true }))
			.not.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /Water Lilies/ })).toBeInTheDocument();
	});

	it('says how to add artworks to a visit without them and leaves out an empty note', async () => {
		render(VisitView, { visit: testVisit({ notes: '' }), artworks: [] });

		await expect.element(page.getByText(m.chronicle.view.noArtworks)).toBeInTheDocument();
		await expect.element(page.getByLabelText(m.common.notes)).not.toBeInTheDocument();
	});

	it('lists the visits of a trip and names its own wall', async () => {
		render(VisitView, {
			visit: testTrip(),
			artworks: [],
			tripVisits: [testVisit({ id: 'louvre', place: 'Louvre', tripId: 'trip' })]
		});

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Paris');
		await expect.element(page.getByText(m.chronicle.trip.overline(5))).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: m.chronicle.trip.view.visitsTitle }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: /Louvre/ }))
			.toHaveAttribute('href', '/atelier/chronicle/louvre');
		await expect.element(page.getByText(m.chronicle.trip.view.noArtworks)).toBeInTheDocument();
	});

	it('shows a failed load of the visits of a trip in their own place', async () => {
		render(VisitView, { visit: testTrip(), artworks: [], tripVisitsError: 'offline' });

		await expect
			.element(
				page.getByRole('region', { name: m.chronicle.trip.view.visitsTitle }).getByText('offline')
			)
			.toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.trip.view.noArtworks)).toBeInTheDocument();
	});
});
