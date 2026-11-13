import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testDetail, testSymbol } from '#lib/testing/symbols/symbols.ts';
import MeaningDetailsDialog from './MeaningDetailsDialog.svelte';

const [transience, penance] = testSymbol.meanings;

function renderDialog(onsave = vi.fn()): typeof onsave {
	render(MeaningDetailsDialog, {
		open: true,
		meaning: transience,
		meanings: testSymbol.meanings,
		details: [
			testDetail('pin-1', { meaningId: transience.id, title: 'Vanitas' }),
			testDetail('pin-2', { meaningId: penance.id, title: 'Saint Jerome' }),
			testDetail('pin-3', { meaningId: null, title: 'The Ambassadors' })
		],
		onsave
	});
	return onsave;
}

describe('MeaningDetailsDialog', () => {
	it('ticks the details of the meaning and names the meaning of the others', async () => {
		renderDialog();

		await expect
			.element(
				page.getByRole('heading', { name: m.symbols.meaningDialog.assignTitle(transience.text) })
			)
			.toBeVisible();
		await expect.element(page.getByRole('checkbox', { name: /Vanitas/ })).toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: /Saint Jerome/ })).not.toBeChecked();
		await expect.element(page.getByText(`2 ${penance.text}`)).toBeVisible();
		await expect
			.element(page.getByText(m.symbols.view.withoutMeaning, { exact: true }))
			.toBeVisible();
	});

	it('saves the details added to the meaning and the ones taken off it', async () => {
		const onsave = renderDialog();

		await page.getByText('Vanitas').click();
		await page.getByText('The Ambassadors').click();
		await page.getByRole('button', { name: m.common.save }).click();

		expect(onsave).toHaveBeenCalledWith(['pin-3'], ['pin-1']);
	});

	it('says when the symbol has no details yet', async () => {
		render(MeaningDetailsDialog, {
			open: true,
			meaning: transience,
			meanings: testSymbol.meanings,
			details: [],
			onsave: vi.fn()
		});

		await expect.element(page.getByText(m.symbols.meaningDialog.noPins)).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.common.save })).not.toBeInTheDocument();
	});
});
