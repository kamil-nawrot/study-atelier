import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnFieldForm from './OwnFieldForm.svelte';
import type { OwnField } from '#lib/card-index/types/own-field.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

const query = {
	insert: vi.fn(),
	select: vi.fn(),
	single: vi.fn(),
	update: vi.fn(),
	eq: vi.fn()
};
const onsaved = vi.fn();

function renderForm(edited?: OwnField): void {
	render(OwnFieldForm, {
		fields: testOwnFields(),
		edited,
		cancelHref: '/atelier/values',
		onsaved
	});
}

function add(): Promise<void> {
	return page.getByRole('button', { name: m.common.add, exact: true }).click();
}

describe('OwnFieldForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.insert.mockReturnValue(query);
		query.select.mockReturnValue(query);
		query.single.mockResolvedValue({ data: { id: 'source' }, error: null });
		query.update.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
		vi.mocked(supabase.rpc).mockResolvedValue({ data: 0, error: null } as never);
		onsaved.mockResolvedValue(undefined);
	});

	it('refuses the name of a built-in field and adds a field with another name', async () => {
		renderForm();
		const name = page.getByRole('textbox', { name: m.common.name });

		await name.fill('Styl');
		await add();

		await expect.element(page.getByText(m.ownFields.errors.builtInName('Styl'))).toBeVisible();
		expect(query.insert).not.toHaveBeenCalled();

		await name.fill('Source');
		await add();

		expect(query.insert).toHaveBeenCalledWith({
			name: 'Source',
			description: null,
			kind: 'text',
			multiple: false,
			closed: false,
			type_codes: []
		});
		expect(onsaved).toHaveBeenCalledWith('source', m.ownFields.created('Source'));
	});

	it('asks about several values and a closed list only for a list', async () => {
		renderForm();
		const multiple = page.getByRole('checkbox', { name: m.ownFields.form.multiple });
		const closed = page.getByRole('checkbox', { name: m.ownFields.form.closed });

		await expect.element(multiple).not.toBeInTheDocument();
		await expect.element(closed).not.toBeInTheDocument();

		await userEvent.click(page.getByRole('radio', { name: new RegExp(m.ownFields.kinds.list) }));

		await expect.element(multiple).toBeInTheDocument();
		await expect.element(closed).toHaveAccessibleDescription(m.ownFields.form.closedHint);
	});

	it('creates a closed list', async () => {
		renderForm();
		await page.getByRole('textbox', { name: m.common.name }).fill('Order');
		await userEvent.click(page.getByRole('radio', { name: new RegExp(m.ownFields.kinds.list) }));
		await page.getByText(m.ownFields.form.closed).click();
		await add();

		expect(query.insert).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Order', kind: 'list', closed: true })
		);
	});

	it('limits a new field to the chosen artwork types', async () => {
		renderForm();
		await page.getByRole('textbox', { name: m.common.name }).fill('Order');
		await page.getByText(m.ownFields.form.limited).click();
		await add();

		await expect.element(page.getByText(m.ownFields.form.typesRequired)).toBeVisible();
		expect(query.insert).not.toHaveBeenCalled();

		await page.getByRole('checkbox', { name: m.artworkTypes.architecture }).click();
		await add();

		expect(query.insert).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Order', type_codes: ['architecture'] })
		);
	});

	it('edits a list without its kind and closes it', async () => {
		renderForm(testOwnFields()[1]);

		await expect
			.element(page.getByRole('radio', { name: new RegExp(m.ownFields.kinds.list) }))
			.not.toBeInTheDocument();
		await page.getByText(m.ownFields.form.closed).click();
		await page.getByRole('button', { name: m.common.save, exact: true }).click();

		expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ closed: true }));
		expect(onsaved).toHaveBeenCalledWith('motifs', m.ownFields.saved('Motifs'));
	});

	it('offers no closed list for a field that is not a list', async () => {
		renderForm(testOwnFields()[2]);

		await expect.element(page.getByRole('textbox', { name: m.common.name })).toBeVisible();
		await expect
			.element(page.getByRole('checkbox', { name: m.ownFields.form.closed }))
			.not.toBeInTheDocument();
	});

	it('names the artworks that lose a value before narrowing the types', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ data: 2, error: null } as never);
		renderForm(testOwnFields()[1]);
		await page.getByText(m.ownFields.form.limited).click();
		await page.getByRole('checkbox', { name: m.artworkTypes.architecture }).click();
		await page.getByRole('button', { name: m.common.save, exact: true }).click();

		await expect.element(page.getByText(m.ownFields.form.narrowDescription(2))).toBeVisible();
		expect(query.update).not.toHaveBeenCalled();

		await page.getByRole('button', { name: m.ownFields.form.narrowConfirm }).click();

		expect(query.update).toHaveBeenCalledWith(
			expect.objectContaining({ type_codes: ['architecture'] })
		);
	});

	it('brings the artwork types into view when the field is limited to some', async () => {
		await page.viewport(390, 480);
		renderForm();
		await page.getByText(m.ownFields.form.limited).click();

		await expect
			.element(page.getByRole('checkbox', { name: m.artworkTypes.other }))
			.toBeInViewport();
	});
});
