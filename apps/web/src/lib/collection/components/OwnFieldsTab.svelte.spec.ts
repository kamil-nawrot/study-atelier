import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { testOwnFields } from '#lib/testing/own-fields.ts';
import OwnFieldsTab from './OwnFieldsTab.svelte';
import type { OwnField } from '../types.ts';

vi.mock('#lib/supabase.ts', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }));

const query = {
	insert: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	eq: vi.fn()
};

const onchanged = vi.fn();

function renderTab(fields: OwnField[] = testOwnFields()): void {
	render(OwnFieldsTab, { fields, onchanged });
}

function menu(name: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.ownFields.menu(name) });
}

describe('OwnFieldsTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.insert.mockResolvedValue({ error: null });
		query.update.mockReturnValue(query);
		query.delete.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
		onchanged.mockResolvedValue(undefined);
	});

	it('says there are no own fields yet', async () => {
		renderTab([]);

		await expect.element(page.getByText(m.ownFields.empty)).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.ownFields.add })).toBeVisible();
	});

	it('shows every field with its kind, count, description and list values', async () => {
		renderTab();

		await expect.element(page.getByRole('heading', { name: 'Motifs' })).toBeVisible();
		await expect.element(page.getByText('Lista · kilka wartości · 3 dzieła')).toBeVisible();
		await expect.element(page.getByText('What the artwork shows')).toBeVisible();
		await expect.element(page.getByText('Zaznaczenie · 0 dzieł')).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.cardIndex.openValue('Angel', '2 dzieła') }))
			.not.toBeInTheDocument();
		await page
			.getByRole('heading', { name: new RegExp(`^${m.ownFields.values}`) })
			.nth(1)
			.click();
		await expect
			.element(page.getByRole('button', { name: m.cardIndex.openValue('Angel', '2 dzieła') }))
			.toBeVisible();
	});

	it('refuses the name of a built-in field and adds a field with another name', async () => {
		renderTab();
		await page.getByRole('button', { name: m.ownFields.add }).click();
		const name = page.getByRole('textbox', { name: m.ownFields.form.name });

		await name.fill('Styl');
		await page.getByRole('button', { name: m.ownFields.form.create, exact: true }).click();

		await expect.element(page.getByText(m.ownFields.errors.builtInName('Styl'))).toBeVisible();
		expect(query.insert).not.toHaveBeenCalled();

		await name.fill('Source');
		await page.getByRole('button', { name: m.ownFields.form.create, exact: true }).click();

		expect(query.insert).toHaveBeenCalledWith({
			name: 'Source',
			description: null,
			kind: 'text',
			multiple: false
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

	it('does not move the first field higher or the last one lower', async () => {
		renderTab();

		await menu('Lecture').click();
		await expect.element(page.getByRole('button', { name: m.ownFields.moveUp })).toBeDisabled();
		await menu('Seen in person').click();

		await expect
			.element(page.getByRole('button', { name: m.ownFields.moveDown }).last())
			.toBeDisabled();
	});

	it('deletes a field after the learner confirms how many artworks lose it', async () => {
		renderTab();

		await menu('Lecture').click();
		await page.getByRole('button', { name: m.ownFields.remove, exact: true }).click();

		const dialog = page.getByRole('alertdialog', {
			name: m.ownFields.deleteConfirm.title('Lecture')
		});
		await expect
			.element(dialog)
			.toHaveAccessibleDescription(m.ownFields.deleteConfirm.description(3));
		await dialog.getByRole('button', { name: m.ownFields.deleteConfirm.confirm }).click();

		expect(query.delete).toHaveBeenCalled();
		expect(query.eq).toHaveBeenCalledWith('id', 'lecture');
		expect(onchanged).toHaveBeenCalledWith(m.ownFields.deleted('Lecture'));
	});

	it('merges a value renamed to another value of the field after a confirmation', async () => {
		renderTab();

		await page
			.getByRole('heading', { name: new RegExp(`^${m.ownFields.values}`) })
			.nth(1)
			.click();
		await page.getByRole('button', { name: m.cardIndex.openValue('Angle', '1 dzieło') }).click();
		await page.getByRole('textbox', { name: m.ownFields.value.name }).fill('angel');

		await expect
			.element(page.getByText(m.ownFields.value.mergeHint('Angel', '2 dzieła')))
			.toBeVisible();
		await page.getByRole('button', { name: m.ownFields.value.merge, exact: true }).click();
		await page
			.getByRole('alertdialog', { name: m.cardIndex.mergeConfirm.title('Angle', 'Angel') })
			.getByRole('button', { name: m.cardIndex.mergeConfirm.confirm })
			.click();

		expect(supabase.rpc).toHaveBeenCalledWith('merge_category_values', {
			merged_id: 'angle',
			kept_id: 'angel'
		});
		expect(onchanged).toHaveBeenCalledWith(m.cardIndex.merged('Angel'));
	});
});
