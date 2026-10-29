import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { createValue, saveValue } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import { saveValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import NewValuePage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({
	createValue: vi.fn(),
	saveValue: vi.fn(),
	loadValuePageContent: vi.fn()
}));
vi.mock('#lib/values/value-details-data/value-details-data.ts', async (importOriginal) => ({
	...(await importOriginal<
		typeof import('#lib/values/value-details-data/value-details-data.ts')
	>()),
	saveValueDetails: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

function renderNew(kind: CategoryCode): void {
	render(NewValuePage, {
		data: {
			session: testSession(),
			subject: { kind, record: { id: '', category: kind, name: '', count: 0 } },
			index: testCardIndex(),
			artworks: [],
			details: emptyValueDetails()
		},
		params: { kind }
	});
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.common.save, exact: true });
}

describe('new value page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
		vi.mocked(createValue).mockResolvedValue({ id: 'material-new' });
		vi.mocked(saveValue).mockResolvedValue({});
		vi.mocked(saveValueDetails).mockResolvedValue({});
	});

	it('adds a material and opens its page with a message', async () => {
		renderNew('material');

		await expect
			.element(page.getByRole('heading', { name: m.valueForm.newTitles.material }))
			.toBeInTheDocument();
		await page.getByLabelText(m.common.name).fill('Tempera');
		await saveButton().click();

		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/values/material/material-new', {
				replace: true,
				refreshAll: true,
				state: { valueMessage: m.valueForm.created('materiał', 'Tempera') }
			})
		);
		expect(createValue).toHaveBeenCalledWith('material', 'Tempera');
	});

	it('asks for a name and refuses a value that already exists', async () => {
		renderNew('material');

		await saveButton().click();
		await expect.element(page.getByText(m.valueForm.nameRequired)).toBeVisible();

		await page.getByLabelText(m.common.name).fill('marble');
		await saveButton().click();
		await expect.element(page.getByText(m.valueForm.exists('materiał', 'Marble'))).toBeVisible();
		expect(createValue).not.toHaveBeenCalled();
	});

	it('shows the fields of an author', async () => {
		renderNew('author');

		await expect
			.element(page.getByRole('heading', { name: m.valueForm.newTitles.author }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.valueForm.portrait.label).first()).toBeVisible();
	});
});
