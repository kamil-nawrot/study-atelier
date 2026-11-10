import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MetaLine from './MetaLine.svelte';

describe('MetaLine', () => {
	it('shows the parts with a hidden separator between them', async () => {
		render(MetaLine, { parts: ['Leonardo da Vinci', 'ok. 1503'] });

		await expect.element(page.getByText('Leonardo da Vinci')).toBeInTheDocument();
		await expect.element(page.getByText('ok. 1503')).toBeInTheDocument();
		await expect
			.element(page.getByText('Leonardo da Vinci · ok. 1503'))
			.toHaveTextContent(/^Leonardo da Vinci · ok\. 1503$/);
		const separators = document.querySelectorAll('[aria-hidden="true"]');
		expect(separators).toHaveLength(1);
		expect(separators[0]?.textContent).toBe('·');
	});

	it('splits a text at its separators and leaves out empty parts', async () => {
		render(MetaLine, { id: 'meta', text: '12 dzieł · zmieniona dziś' });

		await expect.element(page.getByText('12 dzieł')).toBeInTheDocument();
		await expect.element(page.getByText('zmieniona dziś')).toBeInTheDocument();
		expect(document.getElementById('meta')?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
			1
		);
	});

	it('draws no separator for a single part', async () => {
		render(MetaLine, { parts: ['1889', null, ''] });

		await expect.element(page.getByText('1889')).toBeInTheDocument();
		expect(document.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
	});
});
