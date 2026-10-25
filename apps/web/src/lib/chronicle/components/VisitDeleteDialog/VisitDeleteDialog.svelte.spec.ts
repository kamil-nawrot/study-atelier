import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { deleteVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { testVisit, VISIT_ID } from '#lib/testing/chronicle/chronicle.ts';
import VisitDeleteDialog from './VisitDeleteDialog.svelte';

vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({ deleteVisit: vi.fn() }));

const remove = vi.mocked(deleteVisit);

function confirmButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.common.delete, exact: true });
}

describe('VisitDeleteDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks about the visit by its date and deletes it', async () => {
		remove.mockResolvedValue({});
		const ondeleted = vi.fn();
		const visit = testVisit({ date: { on: '2024-10-12', precision: 'day' } });
		render(VisitDeleteDialog, { visit, open: true, ondeleted });

		await expect
			.element(
				page.getByRole('heading', { name: m.chronicle.deleteConfirm.title('12 października 2024') })
			)
			.toBeInTheDocument();
		await userEvent.click(confirmButton());

		await vi.waitFor(() => expect(ondeleted).toHaveBeenCalledWith(visit));
		expect(remove).toHaveBeenCalledWith(VISIT_ID);
	});

	it('keeps the dialog open with the error when the delete fails', async () => {
		remove.mockResolvedValue({ error: m.common.network });
		const ondeleted = vi.fn();
		render(VisitDeleteDialog, { visit: testVisit(), open: true, ondeleted });

		await userEvent.click(confirmButton());

		await expect.element(page.getByText(m.common.network)).toBeInTheDocument();
		expect(ondeleted).not.toHaveBeenCalled();
	});
});
