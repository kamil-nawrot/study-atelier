import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { clearTrash } from '#lib/artworks/trash-data/trash-data.ts';
import { deleteArchivedExhibitions } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import ClearArchive from './ClearArchive.svelte';

vi.mock('#lib/artworks/trash-data/trash-data.ts', () => ({ clearTrash: vi.fn() }));
vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	deleteArchivedExhibitions: vi.fn()
}));

function dialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog');
}

function confirmButton(): ReturnType<typeof page.getByRole> {
	return dialog().getByRole('button', { name: m.trash.clear });
}

describe('ClearArchive', () => {
	const ondone = vi.fn();

	function items(prefix: string, count: number): { id: string }[] {
		return Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index}` }));
	}

	function renderClear(artworks: number, exhibitions: number, removed: string[] = []): string[] {
		render(ClearArchive, {
			props: {
				artworks: items('a', artworks),
				exhibitions: items('e', exhibitions),
				removed,
				ondone
			}
		});
		return removed;
	}

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(clearTrash).mockResolvedValue({});
		vi.mocked(deleteArchivedExhibitions).mockResolvedValue({});
		await page.viewport(1280, 800);
	});

	it('clears both tabs only after the learner confirms that it cannot be undone', async () => {
		const removed = renderClear(3, 2);

		await page.getByRole('button', { name: m.trash.clear }).click();

		await expect.element(dialog().getByText(m.trash.clearDescription(3, 2))).toBeInTheDocument();
		await expect.element(confirmButton()).toBeDisabled();
		await dialog().getByText(m.trash.clearUnderstood).click();
		await confirmButton().click();

		expect(deleteArchivedExhibitions).toHaveBeenCalled();
		expect(clearTrash).toHaveBeenCalled();
		expect(removed).toEqual(['e-0', 'e-1', 'a-0', 'a-1', 'a-2']);
		expect(ondone).toHaveBeenCalled();
		await expect.element(dialog()).not.toBeInTheDocument();
	});

	it('skips a tab with nothing to clear', async () => {
		renderClear(1, 0);

		await page.getByRole('button', { name: m.trash.clear }).click();
		await dialog().getByText(m.trash.clearUnderstood).click();
		await confirmButton().click();

		expect(deleteArchivedExhibitions).not.toHaveBeenCalled();
		expect(clearTrash).toHaveBeenCalled();
	});

	it('shows the error and keeps the artworks when clearing the exhibitions fails', async () => {
		vi.mocked(deleteArchivedExhibitions).mockResolvedValue({ error: m.common.network });
		const removed = renderClear(2, 1);

		await page.getByRole('button', { name: m.trash.clear }).click();
		await dialog().getByText(m.trash.clearUnderstood).click();
		await confirmButton().click();

		await expect.element(dialog().getByText(m.common.network)).toBeInTheDocument();
		await expect.element(dialog().getByText(m.trash.clearErrorTitle)).toBeInTheDocument();
		expect(clearTrash).not.toHaveBeenCalled();
		expect(removed).toEqual([]);
		expect(ondone).not.toHaveBeenCalled();
	});

	it('counts only what is still in the archive and hides when nothing is left', async () => {
		renderClear(2, 1, ['a-0']);

		await page.getByRole('button', { name: m.trash.clear }).click();
		await expect.element(dialog().getByText(m.trash.clearDescription(1, 1))).toBeInTheDocument();
	});

	it('shows nothing when the archive is empty', async () => {
		renderClear(1, 0, ['a-0']);

		await expect.element(page.getByRole('button', { name: m.trash.clear })).not.toBeInTheDocument();
	});

	it('offers the action in the menu of more actions on a phone', async () => {
		await page.viewport(390, 844);
		renderClear(1, 0);

		await page.getByRole('button', { name: m.common.moreActions }).click();

		await expect.element(page.getByRole('button', { name: m.trash.clear })).toBeVisible();
	});
});
