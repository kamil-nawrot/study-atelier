import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import LoadFailure from './LoadFailure.svelte';

describe('LoadFailure', () => {
	it('says what was not found, without an alert, and links back', async () => {
		render(LoadFailure, {
			notFound: true,
			message: 'Nie ma takiego dzieła.',
			backHref: '/atelier',
			backLabel: 'Atelier'
		});

		await expect.element(page.getByText('Nie ma takiego dzieła.')).toBeVisible();
		expect(page.getByRole('alert').elements()).toHaveLength(0);
		await expect
			.element(page.getByRole('link', { name: 'Atelier' }))
			.toHaveAttribute('href', '/atelier');
	});

	it('shows a failed load as a danger alert with its title', async () => {
		render(LoadFailure, {
			notFound: false,
			message: 'Brak połączenia.',
			errorTitle: 'Nie udało się wczytać',
			backHref: '/atelier',
			backLabel: 'Atelier'
		});

		const alert = page.getByRole('alert');
		await expect.element(alert).toHaveTextContent('Nie udało się wczytać');
		await expect.element(alert).toHaveTextContent('Brak połączenia.');
	});

	it('puts a heading above the message when given one', async () => {
		render(LoadFailure, {
			notFound: true,
			message: 'Nie ma takiego dzieła.',
			heading: 'Nie znaleziono #0042',
			backHref: '/atelier',
			backLabel: 'Atelier'
		});

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Nie znaleziono #0042');
	});
});
