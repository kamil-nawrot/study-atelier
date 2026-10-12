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
});
