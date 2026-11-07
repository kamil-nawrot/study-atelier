import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { archiveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import ExhibitionDeleteDialog from './ExhibitionDeleteDialog.svelte';

vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	archiveExhibition: vi.fn()
}));

const archive = vi.mocked(archiveExhibition);

function confirmButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.exhibitions.deleteConfirm.confirm });
}

describe('ExhibitionDeleteDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asks about the exhibition by its title and moves it to Archiwum', async () => {
		archive.mockResolvedValue({});
		const onarchived = vi.fn();
		render(ExhibitionDeleteDialog, { id: 'x', title: 'Light', open: true, onarchived });

		await expect
			.element(page.getByRole('heading', { name: m.exhibitions.deleteConfirm.title('Light') }))
			.toBeInTheDocument();
		await userEvent.click(confirmButton());

		await vi.waitFor(() => expect(onarchived).toHaveBeenCalled());
		expect(archive).toHaveBeenCalledWith('x');
	});

	it('names an exhibition without a title by the placeholder', async () => {
		render(ExhibitionDeleteDialog, { id: 'x', title: '', open: true, onarchived: vi.fn() });

		await expect
			.element(
				page.getByRole('heading', {
					name: m.exhibitions.deleteConfirm.title(m.exhibitions.untitled)
				})
			)
			.toBeInTheDocument();
	});

	it('keeps the dialog open with the error when the move fails', async () => {
		archive.mockResolvedValue({ error: m.common.network });
		const onarchived = vi.fn();
		render(ExhibitionDeleteDialog, { id: 'x', title: 'Light', open: true, onarchived });

		await userEvent.click(confirmButton());

		await expect.element(page.getByText(m.common.network)).toBeInTheDocument();
		expect(onarchived).not.toHaveBeenCalled();
	});
});
