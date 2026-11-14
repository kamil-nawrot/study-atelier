import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { contextLabel } from '#lib/symbols/symbol-contexts/symbol-contexts.ts';
import { searchArtworkContexts } from '#lib/symbols/symbols-data/symbols-data.ts';
import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';
import ContextField from './ContextField.svelte';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ searchArtworkContexts: vi.fn() }));

const peter: SymbolContext = { kind: 'person', entryId: 'peter', name: 'Saint Peter' };
const ambassadors: SymbolContext = {
	kind: 'artwork',
	artworkId: 'a1',
	number: 3,
	name: 'The Ambassadors'
};

function field(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.symbols.form.context });
}

describe('ContextField', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		vi.mocked(searchArtworkContexts).mockResolvedValue([ambassadors]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('picks a person from the glossary as a label', async () => {
		render(ContextField, { candidates: [peter], contexts: [] });

		await userEvent.fill(field(), 'pet');
		await page.getByRole('option', { name: contextLabel(peter) }).click();

		await expect.element(page.getByText(contextLabel(peter))).toBeVisible();
		await expect.element(page.getByText(m.symbols.form.contextHint)).toBeVisible();
	});

	it('finds artworks after a pause in typing', async () => {
		render(ContextField, { candidates: [], contexts: [] });

		await userEvent.fill(field(), 'amba');
		await vi.advanceTimersByTimeAsync(300);

		expect(searchArtworkContexts).toHaveBeenCalledWith('amba', expect.any(AbortSignal));
		await expect
			.element(page.getByRole('option', { name: contextLabel(ambassadors) }))
			.toBeVisible();
	});

	it('keeps typed text as a free label', async () => {
		render(ContextField, { candidates: [peter], contexts: [] });

		await userEvent.fill(field(), 'heraldry');
		await page.getByRole('option', { name: /heraldry/ }).click();

		await expect.element(page.getByRole('button', { name: /heraldry/ })).toBeVisible();
	});
});
