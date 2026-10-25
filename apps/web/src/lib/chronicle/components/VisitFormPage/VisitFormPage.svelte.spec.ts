import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { saveVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { testVisit, VISIT_ID } from '#lib/testing/chronicle/chronicle.ts';
import VisitFormPage from './VisitFormPage.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({ saveVisit: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const save = vi.mocked(saveVisit);

describe('VisitFormPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('says that the visit does not exist', async () => {
		render(VisitFormPage, { data: { notFound: true, artworks: [], places: [] } });

		await expect.element(page.getByText(m.chronicle.errors.notFound)).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: m.chronicle.back })).toBeInTheDocument();
	});

	it('opens the saved visit in place of the form and confirms the save', async () => {
		save.mockResolvedValue({ id: VISIT_ID });
		render(VisitFormPage, {
			data: { visit: testVisit({ place: 'Orsay' }), artworks: [], places: ['Orsay'] }
		});

		await userEvent.click(page.getByRole('button', { name: m.chronicle.form.save, exact: true }));

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(goto).toHaveBeenCalledWith(`/atelier/chronicle/${VISIT_ID}`, {
			replace: true,
			refreshAll: true,
			state: { chronicleMessage: m.chronicle.saved('Orsay', '12 października') }
		});
	});
});
