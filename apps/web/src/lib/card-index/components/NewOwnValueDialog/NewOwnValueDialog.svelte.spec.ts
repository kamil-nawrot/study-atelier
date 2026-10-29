import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { addOwnValue } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import type { OwnField } from '#lib/card-index/types/own-field.ts';
import NewOwnValueDialog from './NewOwnValueDialog.svelte';

vi.mock('#lib/card-index/own-fields-data/own-fields-data.ts', () => ({ addOwnValue: vi.fn() }));

const field = {
	id: 'field-1',
	name: 'Wykład',
	kind: 'list',
	values: [{ id: 'value-1', fieldId: 'field-1', name: 'Barok', count: 2 }]
} as unknown as OwnField;

describe('NewOwnValueDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(addOwnValue).mockResolvedValue({});
	});

	it('adds a value to the field and says so', async () => {
		const onsaved = vi.fn().mockResolvedValue(undefined);
		render(NewOwnValueDialog, { field, onsaved, open: true });

		await expect
			.element(page.getByRole('dialog', { name: m.ownFields.newValueTitle('Wykład') }))
			.toBeVisible();
		await page.getByRole('textbox', { name: m.common.name }).fill(' Renesans ');
		await page.getByRole('button', { name: m.common.save }).click();

		expect(addOwnValue).toHaveBeenCalledWith(field, ' Renesans ');
		expect(onsaved).toHaveBeenCalledWith(m.ownFields.added('Renesans'));
	});

	it('asks for a name and refuses one the field already has', async () => {
		render(NewOwnValueDialog, { field, onsaved: vi.fn(), open: true });

		await page.getByRole('button', { name: m.common.save }).click();
		await expect.element(page.getByText(m.ownFields.errors.nameRequired)).toBeVisible();

		await page.getByRole('textbox', { name: m.common.name }).fill('barok');
		await page.getByRole('button', { name: m.common.save }).click();
		await expect.element(page.getByText(m.ownFields.valueExists('Barok'))).toBeVisible();
		expect(addOwnValue).not.toHaveBeenCalled();
	});

	it('keeps the dialog open with the error when adding fails', async () => {
		vi.mocked(addOwnValue).mockResolvedValue({ error: 'Brak sieci.' });
		render(NewOwnValueDialog, { field, onsaved: vi.fn(), open: true });

		await page.getByRole('textbox', { name: m.common.name }).fill('Renesans');
		await page.getByRole('button', { name: m.common.save }).click();

		await expect.element(page.getByText('Brak sieci.')).toBeVisible();
		await expect.element(page.getByRole('dialog')).toBeVisible();
	});
});
