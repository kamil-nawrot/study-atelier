import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testVisit, VISIT_ID } from '#lib/testing/chronicle/chronicle.ts';
import VisitTicket from './VisitTicket.svelte';

describe('VisitTicket', () => {
	it('links the place to the visit and shows the date, the place and the count', async () => {
		render(VisitTicket, {
			visit: testVisit({ notes: 'Obok [#0025 The Dance Class](/atelier/25) **wisi**.' }),
			count: 6,
			linked: true
		});

		const link = page.getByRole('link', { name: 'Musée d’Orsay' });
		await expect.element(link).toHaveAttribute('href', `/atelier/chronicle/${VISIT_ID}`);
		await expect
			.element(page.getByRole('heading', { level: 3 }))
			.toHaveTextContent('Musée d’Orsay');
		await expect.element(page.getByText('12 października 2026')).toBeInTheDocument();
		await expect.element(page.getByText('Muzeum · Francja')).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.seen(6))).toBeInTheDocument();
		await expect.element(page.getByText('Obok #0025 The Dance Class wisi.')).toBeInTheDocument();
	});

	it('heads the visit view with the place, the weekday and the count in the stub', async () => {
		render(VisitTicket, { visit: testVisit(), count: 2 });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Musée d’Orsay');
		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.kind)).toBeInTheDocument();
		await expect.element(page.getByText('poniedziałek')).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.seenCount(2))).toBeInTheDocument();
		await expect.element(page.getByText('Lilie wodne w owalnej sali.')).not.toBeInTheDocument();
	});

	it('shows only what is known of a place and a date', async () => {
		render(VisitTicket, {
			visit: testVisit({
				placeType: null,
				countryCode: null,
				date: { on: '2019-01-01', precision: 'year' }
			}),
			count: 0,
			linked: true
		});

		await expect.element(page.getByText('2019', { exact: true }).first()).toBeInTheDocument();
		await expect.element(page.getByText(/Francja/)).not.toBeInTheDocument();
	});
});
