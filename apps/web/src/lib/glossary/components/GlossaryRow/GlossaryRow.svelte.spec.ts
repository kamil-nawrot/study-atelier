import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import GlossaryRow from './GlossaryRow.svelte';

describe('GlossaryRow', () => {
	it('links the entry to its page with its category and first sentence', async () => {
		render(GlossaryRow, { entry: testEntry('a-fresco', 'Fresco', { category: 'technique' }) });

		const link = page.getByRole('link', { name: /^Fresco/ });

		await expect.element(link).toHaveAttribute('href', '/atelier/glossary/a-fresco');
		await expect.element(link).toHaveTextContent(m.glossary.categoryNames.technique);
		await expect.element(link).toHaveTextContent('Fresco is a test definition.');
		await expect.element(link).not.toHaveTextContent('second sentence');
	});

	it('shows no sentence for an entry without a definition', async () => {
		render(GlossaryRow, { entry: testEntry('a-nave', 'Nave', { definition: '' }) });

		const link = page.getByRole('link', { name: /^Nave/ });

		await expect.element(link).toHaveTextContent(m.glossary.categoryNames.architecture);
		await expect.element(link).not.toHaveTextContent('definition');
	});

	it('underlines no name on hover', async () => {
		render(GlossaryRow, { entry: testEntry('a-nave', 'Nave') });
		const link = page.getByRole('link', { name: /^Nave/ });

		await link.hover();

		expect(
			getComputedStyle(page.getByText('Nave', { exact: true }).element()).textDecorationLine
		).toBe('none');
	});
});
