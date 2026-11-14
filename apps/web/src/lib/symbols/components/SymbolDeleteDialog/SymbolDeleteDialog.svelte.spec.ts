import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { deleteSymbol } from '#lib/symbols/symbols-data/symbols-data.ts';
import { testSymbol } from '#lib/testing/symbols/symbols.ts';
import SymbolDeleteDialog from './SymbolDeleteDialog.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ deleteSymbol: vi.fn() }));

function deleteButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.common.delete, exact: true });
}

describe('SymbolDeleteDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes the symbol and goes back to the glossary with a message', async () => {
		vi.mocked(deleteSymbol).mockResolvedValue({});
		render(SymbolDeleteDialog, { symbol: testSymbol, open: true });

		await expect
			.element(page.getByRole('heading', { name: m.symbols.deleteConfirm.title('Skull') }))
			.toBeVisible();
		await deleteButton().click();

		expect(deleteSymbol).toHaveBeenCalledWith('skull');
		expect(goto).toHaveBeenCalledWith('/atelier/glossary', {
			refreshAll: true,
			state: { glossaryMessage: m.symbols.view.deleted('Skull') }
		});
	});

	it('stays open with the error when the delete fails', async () => {
		vi.mocked(deleteSymbol).mockResolvedValue({ error: 'Offline.' });
		render(SymbolDeleteDialog, { symbol: testSymbol, open: true });

		await deleteButton().click();

		await expect.element(page.getByText('Offline.')).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});
});
