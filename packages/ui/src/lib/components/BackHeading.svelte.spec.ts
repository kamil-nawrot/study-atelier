import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import BackHeading from './BackHeading.svelte';

describe('BackHeading', () => {
	it('shows the title as the page heading and an arrow back', async () => {
		render(BackHeading, { title: 'Nowe dzieło', backLabel: 'Wróć do Atelier', href: '/atelier' });

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Nowe dzieło');
		await expect
			.element(page.getByRole('link', { name: 'Wróć do Atelier' }))
			.toHaveAttribute('href', '/atelier');
	});

	it('hands a click on the arrow to the page', async () => {
		const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
		render(BackHeading, { title: 'Nowe dzieło', backLabel: 'Wróć', href: '/atelier', onclick });

		await page.getByRole('link', { name: 'Wróć' }).click();

		expect(onclick).toHaveBeenCalledOnce();
	});
});
