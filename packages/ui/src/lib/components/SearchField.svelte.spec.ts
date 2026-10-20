import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { controlHeight, outlinedHeight } from '../testing/control-height';
import SearchField from './SearchField.svelte';

describe('SearchField', () => {
	it('is as high as every other control on a phone and a computer', async () => {
		await page.viewport(390, 844);
		render(SearchField, { label: 'Search' });

		const search = page.getByRole('searchbox', { name: 'Search' }).element();
		expect(outlinedHeight(search, '.search')).toBe(controlHeight());

		await page.viewport(1280, 800);
		expect(outlinedHeight(search, '.search')).toBe(controlHeight());
	});

	it('uses a smaller font than the default on a computer when compact', async () => {
		await page.viewport(1280, 800);
		render(SearchField, { label: 'Default' });
		render(SearchField, { label: 'Compact', compact: true });

		const fontSize = (name: string): number =>
			parseFloat(getComputedStyle(page.getByRole('searchbox', { name }).element()).fontSize);

		expect(fontSize('Compact')).toBeLessThan(fontSize('Default'));
	});
});
