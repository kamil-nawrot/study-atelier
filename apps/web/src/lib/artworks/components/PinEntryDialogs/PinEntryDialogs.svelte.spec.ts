import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { saveGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
import { createSymbolOption } from '#lib/symbols/symbols-data/symbols-data.ts';
import { PinEntries } from '#lib/artworks/pin-entries/pin-entries.svelte.ts';
import PinEntryDialogs from './PinEntryDialogs.svelte';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	addSymbolMeaning: vi.fn(),
	createSymbolOption: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ saveGlossaryEntry: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

describe('PinEntryDialogs', () => {
	it('opens the symbol dialog with the typed name', async () => {
		const entries = new PinEntries(
			() => [],
			() => []
		);
		render(PinEntryDialogs, { entries });

		void entries.newSymbol('Anchor');

		const dialog = page.getByRole('alertdialog', { name: m.symbols.quick.title });
		await expect.element(dialog.getByLabelText(m.common.name)).toHaveValue('Anchor');
	});

	it('opens the term dialog with the typed name', async () => {
		const entries = new PinEntries(
			() => [],
			() => []
		);
		render(PinEntryDialogs, { entries });

		void entries.newTerm('Nave');

		const dialog = page.getByRole('dialog', { name: m.glossary.form.newTitle });
		await expect.element(dialog.getByLabelText(m.common.name)).toHaveValue('Nave');
	});

	it('resolves the new symbol once the dialog adds it', async () => {
		const anchor = { id: 'symbol-1', name: 'Anchor', meanings: [] };
		vi.mocked(createSymbolOption).mockResolvedValue({ symbol: anchor });
		const entries = new PinEntries(
			() => [],
			() => []
		);
		render(PinEntryDialogs, { entries });

		const added = entries.newSymbol('Anchor');
		await page.getByRole('button', { name: m.symbols.quick.add }).click();

		await expect(added).resolves.toEqual(anchor);
		expect(entries.symbols).toEqual([anchor]);
	});

	it('resolves the new term once the dialog adds it', async () => {
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ id: 'term-1' });
		const entries = new PinEntries(
			() => [],
			() => []
		);
		render(PinEntryDialogs, { entries });

		const added = entries.newTerm('Nave');
		const dialog = page.getByRole('dialog', { name: m.glossary.form.newTitle });
		await dialog.getByRole('radio', { name: m.glossary.categoryNames.architecture }).click();
		await dialog.getByRole('button', { name: m.glossary.quick.add }).click();

		await expect(added).resolves.toEqual(expect.objectContaining({ id: 'term-1', name: 'Nave' }));
		expect(entries.terms.map((term) => term.id)).toEqual(['term-1']);
	});
});
