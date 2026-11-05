import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnFieldsTab from './OwnFieldsTab.svelte';
import type { OwnField } from '#lib/card-index/types/own-field.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

const query = { insert: vi.fn() };
const onchanged = vi.fn();

function renderTab(fields: OwnField[] = testOwnFields(), error?: string): void {
	render(OwnFieldsTab, { fields, error, onchanged });
}

describe('OwnFieldsTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.insert.mockResolvedValue({ error: null });
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
		onchanged.mockResolvedValue(undefined);
	});

	it('says there are no own fields yet and offers no reordering', async () => {
		renderTab([]);

		await expect.element(page.getByText(m.ownFields.empty)).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.ownFields.add })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.ownFields.reorder }))
			.not.toBeInTheDocument();
	});

	it('says the fields could not be loaded', async () => {
		renderTab([], 'No connection');

		await expect.element(page.getByText('No connection')).toBeVisible();
	});

	it('lists the fields as links to their pages', async () => {
		renderTab();

		await expect.element(page.getByText(m.ownFields.intro)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.cardIndex.openValue('Lecture', '3 dzieła') }))
			.toBeVisible();
	});

	it('refuses the name of a built-in field and adds a field with another name', async () => {
		renderTab();
		await page.getByRole('button', { name: m.ownFields.add }).click();
		const name = page.getByRole('textbox', { name: m.common.name });

		await name.fill('Styl');
		await page.getByRole('button', { name: m.common.add, exact: true }).click();

		await expect.element(page.getByText(m.ownFields.errors.builtInName('Styl'))).toBeVisible();
		expect(query.insert).not.toHaveBeenCalled();

		await name.fill('Source');
		await page.getByRole('button', { name: m.common.add, exact: true }).click();

		expect(query.insert).toHaveBeenCalledWith({
			name: 'Source',
			description: null,
			kind: 'text',
			multiple: false,
			type_codes: []
		});
		expect(onchanged).toHaveBeenCalledWith(m.ownFields.created('Source'));
	});

	it('asks whether a list takes several values only for a list', async () => {
		renderTab();
		await page.getByRole('button', { name: m.ownFields.add }).click();
		const multiple = page.getByRole('checkbox', { name: m.ownFields.form.multiple });

		await expect.element(multiple).not.toBeInTheDocument();

		await userEvent.click(page.getByRole('radio', { name: new RegExp(m.ownFields.kinds.list) }));

		await expect.element(multiple).toBeInTheDocument();
	});

	it('limits a new field to the chosen artwork types', async () => {
		renderTab();
		await page.getByRole('button', { name: m.ownFields.add }).click();
		await page.getByRole('textbox', { name: m.common.name }).fill('Order');
		await page.getByText(m.ownFields.form.limited).click();
		await page.getByRole('button', { name: m.common.add, exact: true }).click();

		await expect.element(page.getByText(m.ownFields.form.typesRequired)).toBeVisible();
		expect(query.insert).not.toHaveBeenCalled();

		await page.getByRole('checkbox', { name: m.artworkTypes.architecture }).click();
		await page.getByRole('button', { name: m.common.add, exact: true }).click();

		expect(query.insert).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Order', type_codes: ['architecture'] })
		);
	});

	it('moves a field in the reorder mode and leaves it with "Gotowe"', async () => {
		renderTab();
		await page.getByRole('button', { name: m.ownFields.reorder }).click();

		await expect.element(page.getByText(m.ownFields.reorderHint)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.ownFields.add }))
			.not.toBeInTheDocument();
		await page.getByRole('button', { name: m.ownFields.moveFieldDown('Lecture') }).click();

		expect(supabase.rpc).toHaveBeenCalledWith('move_artwork_field', {
			target_field: 'lecture',
			direction: 1
		});
		await vi.waitFor(() => expect(onchanged).toHaveBeenCalledWith());

		await page.getByRole('button', { name: m.ownFields.reorderDone }).click();
		await expect.element(page.getByRole('link').first()).toBeVisible();
	});

	it('says a move failed', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ error: { code: 'XX000' } } as never);
		renderTab();
		await page.getByRole('button', { name: m.ownFields.reorder }).click();
		await page.getByRole('button', { name: m.ownFields.moveFieldUp('Motifs') }).click();

		await expect.element(page.getByText(m.ownFields.errorTitle)).toBeVisible();
		expect(onchanged).not.toHaveBeenCalled();
	});
});
