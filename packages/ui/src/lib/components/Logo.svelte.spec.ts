import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../styles/index.css';
import Logo from './Logo.svelte';

function heightOf(label: string): number {
	return page.getByRole('img', { name: label }).element().getBoundingClientRect().height;
}

describe('Logo', () => {
	it('is an image named by its label', async () => {
		render(Logo, { label: 'Study Atelier' });

		await expect.element(page.getByRole('img', { name: 'Study Atelier' })).toBeVisible();
	});

	it('grows in height from the small to the large size', async () => {
		render(Logo, { label: 'Small', size: 'sm' });
		render(Logo, { label: 'Medium' });
		render(Logo, { label: 'Large', size: 'lg' });

		expect(heightOf('Small')).toBeLessThan(heightOf('Medium'));
		expect(heightOf('Medium')).toBeLessThan(heightOf('Large'));
	});
});
