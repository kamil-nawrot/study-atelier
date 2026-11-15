import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { createSymbolOption } from '#lib/symbols/symbols-data/symbols-data.ts';
import NewSymbolDialog from './NewSymbolDialog.svelte';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ createSymbolOption: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const ANCHOR = { id: 'symbol-1', name: 'Anchor', meanings: [{ id: 'meaning-1', text: 'Hope' }] };

function openDialog(): ReturnType<typeof vi.fn> {
	const onadded = vi.fn();
	render(NewSymbolDialog, { open: true, name: ' Anchor ', onadded });
	return onadded;
}

describe('NewSymbolDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('adds the symbol with its first meaning', async () => {
		vi.mocked(createSymbolOption).mockResolvedValue({ symbol: ANCHOR });
		const onadded = openDialog();

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('Anchor');
		await expect.element(page.getByText(m.symbols.quick.meaningHint)).toBeVisible();
		await userEvent.fill(page.getByLabelText(m.symbols.quick.meaning), 'Hope');
		await page.getByRole('button', { name: m.symbols.quick.add }).click();

		expect(createSymbolOption).toHaveBeenCalledWith('Anchor', 'Hope');
		expect(onadded).toHaveBeenCalledWith(ANCHOR);
	});

	it('asks for a name and shows why the symbol could not be added', async () => {
		vi.mocked(createSymbolOption).mockResolvedValue({ error: m.symbols.form.nameTaken('Keys') });
		const onadded = openDialog();

		await userEvent.clear(page.getByLabelText(m.common.name));
		await page.getByRole('button', { name: m.symbols.quick.add }).click();
		await expect.element(page.getByText(m.valueForm.nameRequired)).toBeVisible();
		expect(createSymbolOption).not.toHaveBeenCalled();

		await userEvent.fill(page.getByLabelText(m.common.name), 'Keys');
		await page.getByRole('button', { name: m.symbols.quick.add }).click();
		await expect.element(page.getByText(m.symbols.form.nameTaken('Keys'))).toBeVisible();
		expect(onadded).not.toHaveBeenCalled();
	});
});
