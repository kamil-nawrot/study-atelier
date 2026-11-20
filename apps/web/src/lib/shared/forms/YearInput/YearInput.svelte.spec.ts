import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import YearInput from './YearInput.svelte';

describe('YearInput', () => {
	it('toggles "p.n.e." with a click, the space bar and Enter', async () => {
		const props = $state({ label: 'Rok', value: '13', beforeCommonEra: false });
		render(YearInput, props);

		const era = page.getByRole('button', { name: m.artworkForm.beforeCommonEra });
		await expect.element(era).toHaveAttribute('aria-pressed', 'false');
		await userEvent.click(era);
		await expect.element(era).toHaveAttribute('aria-pressed', 'true');
		await userEvent.type(era, ' ');
		await expect.element(era).toHaveAttribute('aria-pressed', 'false');
		await userEvent.type(era, '{Enter}');
		await expect.element(era).toHaveAttribute('aria-pressed', 'true');
		expect(page.getByRole('checkbox').query()).toBeNull();
	});

	it('names the block for its input and disables it while filling', async () => {
		render(YearInput, {
			label: 'Od',
			beforeCommonEraLabel: m.artworkForm.beforeCommonEraFrom,
			value: '',
			beforeCommonEra: false,
			filling: true
		});

		await expect
			.element(page.getByRole('button', { name: m.artworkForm.beforeCommonEraFrom }))
			.toBeDisabled();
	});
});
