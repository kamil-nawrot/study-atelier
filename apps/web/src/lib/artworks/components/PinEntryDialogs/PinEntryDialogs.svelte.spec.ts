import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
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
});
