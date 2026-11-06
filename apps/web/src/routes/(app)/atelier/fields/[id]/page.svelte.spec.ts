import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import FieldPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/fields/motifs'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));

describe('own field page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('opens the field form and the delete question from the bar', async () => {
		const fields = testOwnFields();
		render(FieldPage, {
			data: { session: testSession(), field: fields[1], fields },
			params: { id: 'motifs' }
		});

		await page.getByRole('button', { name: m.common.edit }).click();
		await expect.element(page.getByRole('textbox', { name: m.common.name })).toHaveValue('Motifs');
		await page.getByRole('button', { name: m.common.cancel }).click();

		await page.getByRole('button', { name: m.common.delete }).click();
		await expect
			.element(page.getByRole('alertdialog', { name: m.ownFields.deleteConfirm.title('Motifs') }))
			.toBeVisible();
	});

	it('says the field does not exist', async () => {
		render(FieldPage, {
			data: {
				session: testSession(),
				fields: [],
				error: m.ownFields.page.notFound,
				notFound: true
			},
			params: { id: 'gone' }
		});

		await expect.element(page.getByText(m.ownFields.page.notFound)).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.common.edit })).not.toBeInTheDocument();
	});
});
