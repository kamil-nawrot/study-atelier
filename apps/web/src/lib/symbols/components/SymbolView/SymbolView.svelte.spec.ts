import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSymbol, testSymbolPage } from '#lib/testing/symbols/symbols.ts';
import SymbolView from './SymbolView.svelte';

const { setSymbolCover, assignMeaning, saveSymbol, invalidateAll, loadSymbolForm } = vi.hoisted(
	() => ({
		setSymbolCover: vi.fn(),
		assignMeaning: vi.fn(),
		saveSymbol: vi.fn(),
		invalidateAll: vi.fn(),
		loadSymbolForm: vi.fn()
	})
);

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	setSymbolCover,
	assignMeaning,
	saveSymbol,
	searchArtworkContexts: vi.fn().mockResolvedValue([])
}));
vi.mock('$app/navigation', () => ({ invalidateAll }));
vi.mock('#lib/symbols/symbol-page-data/symbol-page-data.ts', () => ({ loadSymbolForm }));

beforeEach(() => {
	setSymbolCover.mockReset().mockResolvedValue({});
	assignMeaning.mockReset().mockResolvedValue({});
	saveSymbol.mockReset().mockResolvedValue({ id: 'skull' });
	invalidateAll.mockReset().mockResolvedValue(undefined);
	loadSymbolForm.mockReset().mockResolvedValue({ candidates: [] });
});

describe('SymbolView', () => {
	it('shows the name, every meaning, the details without a meaning and the axis', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await expect.element(page.getByRole('heading', { level: 1, name: 'Skull' })).toBeVisible();
		await expect.element(page.getByText(m.symbols.view.overline, { exact: true })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: '1 transience, death' })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: '2 penance' })).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.symbols.view.withoutMeaning }))
			.toBeVisible();
		await expect.element(page.getByRole('heading', { name: m.symbols.view.axis })).toBeVisible();
	});

	it('shows the description under the name', async () => {
		render(SymbolView, {
			symbol: { ...testSymbol, description: 'A reminder of death.' },
			page: testSymbolPage()
		});

		await expect.element(page.getByText('A reminder of death.')).toBeVisible();
	});

	it('assigns details to a meaning from its menu with a toast', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await page
			.getByRole('button', { name: m.symbols.meaningDialog.actions('transience, death') })
			.click();
		await page.getByRole('button', { name: m.symbols.meaningDialog.assign }).click();
		await page.getByRole('dialog').getByText('Saint Jerome Writing').click();
		await page.getByRole('button', { name: m.common.save }).click();

		expect(assignMeaning).toHaveBeenCalledWith('transience', ['pin-1'], []);
		expect(invalidateAll).toHaveBeenCalled();
		await expect.element(page.getByText(m.symbols.meaningDialog.assigned)).toBeVisible();
	});

	it('warns when the details did not load', async () => {
		render(SymbolView, {
			symbol: testSymbol,
			page: testSymbolPage({ details: [], withoutMeaning: [], detailsError: 'Offline.' })
		});

		await expect.element(page.getByText('Offline.')).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.symbols.view.withoutMeaning }))
			.not.toBeInTheDocument();
	});

	it('marks a detail as the main one with a toast and leaves the mark alone on a second click', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await page.getByRole('button', { name: m.symbols.view.setMainDetail }).first().click();

		expect(setSymbolCover).toHaveBeenCalledWith('skull', expect.any(String));
		await expect.element(page.getByText(m.symbols.view.mainDetailSaved)).toBeVisible();
		await page.getByRole('button', { name: m.symbols.view.mainDetail }).click();
		expect(setSymbolCover).toHaveBeenCalledTimes(1);
	});

	it('says when the main detail could not be saved', async () => {
		setSymbolCover.mockResolvedValue({ error: 'Offline.' });
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await page.getByRole('button', { name: m.symbols.view.setMainDetail }).first().click();

		await expect.element(page.getByText('Offline.')).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.symbols.view.mainDetail }))
			.not.toBeInTheDocument();
	});

	it('adds a meaning from a dialog and says it was saved', async () => {
		const { component } = await render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await component.addMeaning();
		await page.getByRole('textbox', { name: m.symbols.form.meaning }).fill('danger');
		await page.getByRole('button', { name: m.common.save }).click();

		expect(saveSymbol).toHaveBeenCalledWith(
			{
				name: 'Skull',
				description: '',
				meanings: [
					expect.objectContaining({ id: 'transience' }),
					expect.objectContaining({ id: 'penance' }),
					expect.objectContaining({ text: 'danger', contexts: [] })
				]
			},
			'skull'
		);
		expect(invalidateAll).toHaveBeenCalled();
		await expect.element(page.getByText(m.symbols.meaningDialog.saved)).toBeVisible();
	});

	it('asks for the text of a new meaning', async () => {
		const { component } = await render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await component.addMeaning();
		await page.getByRole('button', { name: m.common.save }).click();

		await expect.element(page.getByText(m.symbols.form.meaningRequired)).toBeVisible();
		expect(saveSymbol).not.toHaveBeenCalled();
	});

	it('edits a meaning from its menu', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await page.getByRole('button', { name: m.symbols.meaningDialog.actions('penance') }).click();
		await page.getByRole('button', { name: m.symbols.meaningDialog.edit }).click();
		const field = page.getByRole('textbox', { name: m.symbols.form.meaning });
		await expect.element(field).toHaveValue('penance');
		await field.fill('repentance');
		await page.getByRole('button', { name: m.common.save }).click();

		expect(saveSymbol).toHaveBeenCalledWith(
			expect.objectContaining({
				meanings: [
					expect.objectContaining({ id: 'transience' }),
					expect.objectContaining({ id: 'penance', text: 'repentance' })
				]
			}),
			'skull'
		);
	});

	it('moves a meaning up while reordering', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage(), reordering: true });

		await page.getByRole('button', { name: m.symbols.meaningDialog.moveUp('penance') }).click();

		expect(saveSymbol).toHaveBeenCalledWith(
			expect.objectContaining({
				meanings: [
					expect.objectContaining({ id: 'penance' }),
					expect.objectContaining({ id: 'transience' })
				]
			}),
			'skull'
		);
	});

	it('removes a meaning after a confirmation', async () => {
		render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await page
			.getByRole('button', { name: m.symbols.meaningDialog.actions('transience, death') })
			.click();
		await page.getByRole('button', { name: m.symbols.meaningDialog.remove }).click();
		await expect
			.element(page.getByText(m.symbols.meaningDialog.removeTitle('transience, death')))
			.toBeVisible();
		await page.getByRole('button', { name: m.common.delete }).click();

		expect(saveSymbol).toHaveBeenCalledWith(
			expect.objectContaining({ meanings: [expect.objectContaining({ id: 'penance' })] }),
			'skull'
		);
		await expect.element(page.getByText(m.symbols.meaningDialog.removed)).toBeVisible();
	});

	it('says why a meaning could not be saved and keeps the dialog open', async () => {
		saveSymbol.mockResolvedValue({ error: 'Offline.' });
		const { component } = await render(SymbolView, { symbol: testSymbol, page: testSymbolPage() });

		await component.addMeaning();
		await page.getByRole('textbox', { name: m.symbols.form.meaning }).fill('danger');
		await page.getByRole('button', { name: m.common.save }).click();

		await expect.element(page.getByText('Offline.')).toBeVisible();
		expect(invalidateAll).not.toHaveBeenCalled();
	});
});
