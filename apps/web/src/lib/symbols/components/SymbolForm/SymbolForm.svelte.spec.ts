import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { contextLabel } from '#lib/symbols/symbol-contexts/symbol-contexts.ts';
import { saveSymbol, searchArtworkContexts } from '#lib/symbols/symbols-data/symbols-data.ts';
import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';
import { testSymbol } from '#lib/testing/symbols/symbols.ts';
import SymbolForm from './SymbolForm.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	saveSymbol: vi.fn(),
	searchArtworkContexts: vi.fn()
}));

const peter: SymbolContext = { kind: 'person', entryId: 'peter', name: 'Saint Peter' };

function renderForm(symbol = undefined as typeof testSymbol | undefined): ReturnType<typeof vi.fn> {
	const onsaved = vi.fn();
	render(SymbolForm, { symbol, candidates: [peter], cancelHref: '/atelier/glossary', onsaved });
	return onsaved;
}

function meaningFields(): ReturnType<typeof page.getByRole> {
	return page.getByRole('textbox', { name: m.symbols.form.meaning });
}

function save(): Promise<void> {
	return page.getByRole('button', { name: m.common.save, exact: true }).click();
}

describe('SymbolForm', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(searchArtworkContexts).mockResolvedValue([]);
		vi.mocked(saveSymbol).mockResolvedValue({ id: 'keys' });
		await page.viewport(1280, 800);
	});

	it('saves a new symbol with its meanings and labels, leaving out empty meanings', async () => {
		const onsaved = renderForm();

		await page.getByLabelText(m.common.name).fill('Keys');
		await meaningFields().fill('power of the Church');
		await page.getByRole('button', { name: m.symbols.form.addContext }).click();
		await userEvent.fill(page.getByRole('combobox', { name: m.symbols.form.context }), 'peter');
		await page.getByRole('option', { name: contextLabel(peter) }).click();
		await page.getByRole('button', { name: m.symbols.form.addMeaning }).click();
		await save();

		expect(saveSymbol).toHaveBeenCalledWith(
			{
				name: 'Keys',
				meanings: [expect.objectContaining({ text: 'power of the Church', contexts: [peter] })]
			},
			undefined
		);
		expect(onsaved).toHaveBeenCalledWith(
			'/atelier/glossary/symbols/keys',
			m.symbols.view.saved('Keys')
		);
	});

	it('asks for a name and for the text of a labelled meaning', async () => {
		renderForm();

		await page.getByRole('button', { name: m.symbols.form.addContext }).click();
		await userEvent.fill(page.getByRole('combobox', { name: m.symbols.form.context }), 'peter');
		await page.getByRole('option', { name: contextLabel(peter) }).click();
		await save();

		await expect.element(page.getByText(m.valueForm.nameRequired)).toBeVisible();
		await expect.element(page.getByText(m.symbols.form.meaningRequired)).toBeVisible();
		expect(saveSymbol).not.toHaveBeenCalled();
	});

	it('reorders and removes the meanings of a saved symbol', async () => {
		vi.mocked(saveSymbol).mockResolvedValue({ id: 'skull' });
		renderForm(testSymbol);

		await page.getByRole('button', { name: m.symbols.form.moveUp(2) }).click();
		await page.getByRole('button', { name: m.symbols.form.removeMeaning(2) }).click();
		await save();

		expect(saveSymbol).toHaveBeenCalledWith(
			{ name: 'Skull', meanings: [expect.objectContaining({ id: 'penance' })] },
			'skull'
		);
	});

	it('shows a taken name next to the field and other failures above the form', async () => {
		vi.mocked(saveSymbol).mockResolvedValue({ nameTaken: true });
		renderForm();

		await page.getByLabelText(m.common.name).fill('Skull');
		await save();
		await expect.element(page.getByText(m.symbols.form.nameTaken('Skull'))).toBeVisible();

		vi.mocked(saveSymbol).mockResolvedValue({ error: 'Offline.' });
		await page.getByLabelText(m.common.name).fill('Skulls');
		await save();
		await expect.element(page.getByText('Offline.')).toBeVisible();
	});

	it('keeps one meaning field when the last one is removed', async () => {
		renderForm();

		await page.getByRole('button', { name: m.symbols.form.removeMeaning(1) }).click();

		await expect.element(meaningFields()).toBeVisible();
	});
});
