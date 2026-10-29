import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import DisplayCase from './DisplayCase.svelte';

const exhibits: Exhibit[] = [
	{ code: 'collection', value: 24, thresholds: [1, 10, 50], tiers: [] },
	{ code: 'eras', value: 1, thresholds: [2, 3, 4, 5, 6], tiers: [] }
];

describe('DisplayCase', () => {
	it('shows every exhibit in its own case, in the given order', async () => {
		render(DisplayCase, { props: { exhibits } });

		const names = page.getByRole('heading', { level: 3 });
		await expect.element(names.nth(0)).toHaveTextContent(m.career.exhibits.collection.name);
		await expect.element(names.nth(1)).toHaveTextContent(m.career.exhibits.eras.name);
	});

	it('credits the engravings it shows', async () => {
		render(DisplayCase, { props: { exhibits } });

		await expect.element(page.getByRole('heading', { name: m.career.credits })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: /Musei Wormiani Historia/ }))
			.toHaveAttribute(
				'href',
				'https://commons.wikimedia.org/wiki/File:1655_-_Frontispiece_of_Museum_Wormiani_Historia.jpg'
			);
	});
});
