import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testDetail } from '#lib/testing/symbols/symbols.ts';
import SymbolDetails from './SymbolDetails.svelte';

describe('SymbolDetails', () => {
	it('links each detail to its pin on the artwork with the title and byline', async () => {
		render(SymbolDetails, { details: [testDetail('pin-1')] });

		const link = page.getByRole('link', { name: /Saint Jerome Writing/ });
		await expect.element(link).toHaveAttribute('href', '/atelier/12?pin=pin-1');
		await expect.element(link).toHaveTextContent('Caravaggio, 1606');
		expect(document.querySelector('.lens')).not.toBeNull();
	});

	it('lists a pin without a view by title, without a lens', async () => {
		render(SymbolDetails, { details: [testDetail('pin-2', { lens: undefined })] });

		await expect.element(page.getByRole('link', { name: /Saint Jerome Writing/ })).toBeVisible();
		expect(document.querySelector('.lens')).toBeNull();
	});
});
