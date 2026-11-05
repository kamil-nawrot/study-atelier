import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, invalidateAll } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnFieldPage from './OwnFieldPage.svelte';
import type { OwnFieldPageData } from '#lib/card-index/own-field-pages/own-field-pages.ts';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/fields/motifs'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));

const query = { insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn() };

function renderPage(data: Partial<OwnFieldPageData> = {}): void {
	const fields = testOwnFields();
	render(OwnFieldPage, {
		email: 'learner@example.com',
		data: { field: fields[1], fields, ...data }
	});
}

describe('OwnFieldPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.insert.mockResolvedValue({ error: null });
		query.update.mockReturnValue(query);
		query.delete.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
	});

	it('lists the values of a list field as links to their pages', async () => {
		renderPage();

		await expect.element(page.getByRole('heading', { level: 1, name: 'Motifs' })).toBeVisible();
		await expect.element(page.getByText(m.ownFields.page.valueCount(2))).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.cardIndex.openValue('Angel', '2 dzieła') }))
			.toHaveAttribute('href', '/atelier/fields/motifs/values/angel');
	});

	it('says a field that is not a list has no values', async () => {
		const fields = testOwnFields();
		renderPage({ field: fields[2] });

		await expect.element(page.getByText(m.ownFields.page.noList)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.ownFields.addValue }))
			.not.toBeInTheDocument();
	});

	it('adds a value and reloads the page', async () => {
		renderPage();
		await page.getByRole('button', { name: m.ownFields.addValue }).click();
		await page.getByRole('textbox', { name: m.common.name }).fill('Lion');
		await page.getByRole('button', { name: m.common.save, exact: true }).click();

		expect(query.insert).toHaveBeenCalledWith({ category_code: 'motifs', name: 'Lion' });
		await vi.waitFor(() => expect(invalidateAll).toHaveBeenCalled());
		await expect.element(page.getByText(m.ownFields.added('Lion'))).toBeVisible();
	});

	it('edits the field in its form', async () => {
		renderPage();
		await page.getByRole('button', { name: m.common.edit }).click();
		await page.getByRole('textbox', { name: m.common.name }).fill('Subjects');
		await page.getByRole('button', { name: m.common.save, exact: true }).click();

		expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Subjects' }));
		await vi.waitFor(() => expect(invalidateAll).toHaveBeenCalled());
	});

	it('deletes the field after a confirmation and returns to the card index', async () => {
		renderPage();
		await page.getByRole('button', { name: m.common.delete }).click();

		const dialog = page.getByRole('alertdialog', {
			name: m.ownFields.deleteConfirm.title('Motifs')
		});
		await expect
			.element(dialog)
			.toHaveAccessibleDescription(m.ownFields.deleteConfirm.description(3));
		await dialog.getByRole('button', { name: m.ownFields.deleteConfirm.confirm }).click();

		expect(query.eq).toHaveBeenCalledWith('id', 'motifs');
		expect(goto).toHaveBeenCalledWith('/atelier/values', {
			refreshAll: true,
			state: { valueMessage: m.ownFields.deleted('Motifs') }
		});
	});

	it('keeps the field and says why when deleting fails', async () => {
		query.eq.mockResolvedValue({ error: { code: 'XX000' } });
		renderPage();
		await page.getByRole('button', { name: m.common.delete }).click();
		await page.getByRole('button', { name: m.ownFields.deleteConfirm.confirm }).click();

		await expect.element(page.getByText(m.ownFields.errorTitle)).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});

	it('says the field does not exist', async () => {
		renderPage({ field: undefined, error: m.ownFields.page.notFound, notFound: true });

		await expect.element(page.getByText(m.ownFields.page.notFound)).toBeVisible();
	});
});
