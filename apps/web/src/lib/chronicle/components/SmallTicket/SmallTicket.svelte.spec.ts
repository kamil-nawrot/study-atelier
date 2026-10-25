import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testVisit, VISIT_ID } from '#lib/testing/chronicle/chronicle.ts';
import SmallTicket from './SmallTicket.svelte';

describe('SmallTicket', () => {
	it('links to the visit with its date and place', async () => {
		render(SmallTicket, { visit: testVisit() });

		const link = page.getByRole('link', {
			name: /^12 października 2026.*Musée d’Orsay$/
		});
		await expect.element(link).toHaveAttribute('href', `/atelier/chronicle/${VISIT_ID}`);
		await expect.element(page.getByText('paź 2026')).toBeInTheDocument();
	});

	it('shows only what is known of the date', async () => {
		render(SmallTicket, { visit: testVisit({ date: { on: '2019-01-01', precision: 'year' } }) });

		await expect
			.element(page.getByRole('link', { name: /^2019.*Musée d’Orsay$/ }))
			.toBeInTheDocument();
	});
});
