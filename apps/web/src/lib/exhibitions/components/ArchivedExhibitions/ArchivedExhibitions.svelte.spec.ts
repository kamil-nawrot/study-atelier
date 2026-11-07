import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import {
	deleteExhibition,
	restoreExhibition
} from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import ArchivedExhibitions from './ArchivedExhibitions.svelte';

vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	deleteExhibition: vi.fn(),
	restoreExhibition: vi.fn()
}));

const restore = vi.mocked(restoreExhibition);
const remove = vi.mocked(deleteExhibition);

const light = {
	id: 'a',
	title: 'Light',
	updatedAt: '2026-11-01T10:00:00Z',
	deletedAt: '2026-11-02T10:00:00Z',
	artworkCount: 2,
	coverId: null
};

function row(title: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('listitem').filter({ hasText: title });
}

describe('ArchivedExhibitions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('says that Archiwum holds no exhibitions', async () => {
		render(ArchivedExhibitions, { exhibitions: [], covers: [], onmessage: vi.fn() });

		await expect.element(page.getByText(m.trash.exhibitionsEmpty)).toBeInTheDocument();
	});

	it('restores an exhibition and takes it off the list', async () => {
		restore.mockResolvedValue({});
		const onmessage = vi.fn();
		render(ArchivedExhibitions, { exhibitions: [light], covers: [], onmessage });

		await userEvent.click(row('Light').getByRole('button', { name: m.trash.restore }));

		await vi.waitFor(() =>
			expect(onmessage).toHaveBeenCalledWith(m.trash.exhibitionRestored('Light'))
		);
		expect(restore).toHaveBeenCalledWith('a');
		await expect.element(row('Light')).not.toBeInTheDocument();
	});

	it('shows why an exhibition could not be restored and keeps it', async () => {
		restore.mockResolvedValue({ error: m.common.network });
		render(ArchivedExhibitions, { exhibitions: [light], covers: [], onmessage: vi.fn() });

		await userEvent.click(row('Light').getByRole('button', { name: m.trash.restore }));

		await expect.element(page.getByText(m.common.network)).toBeInTheDocument();
		await expect.element(row('Light')).toBeInTheDocument();
	});

	it('deletes an exhibition for good only after the learner confirms', async () => {
		remove.mockResolvedValue({});
		const onmessage = vi.fn();
		render(ArchivedExhibitions, { exhibitions: [light], covers: [], onmessage });

		await userEvent.click(row('Light').getByRole('button', { name: m.trash.deleteForever }));
		expect(remove).not.toHaveBeenCalled();
		await expect
			.element(page.getByRole('heading', { name: m.trash.exhibitionDeleteTitle('Light') }))
			.toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: m.trash.deleteForever }).last());

		await vi.waitFor(() =>
			expect(onmessage).toHaveBeenCalledWith(m.trash.exhibitionDeleted('Light'))
		);
		expect(remove).toHaveBeenCalledWith('a');
	});

	it('keeps the dialog open with the reason when deleting fails', async () => {
		remove.mockResolvedValue({ error: m.common.network });
		const onmessage = vi.fn();
		render(ArchivedExhibitions, { exhibitions: [light], covers: [], onmessage });

		await userEvent.click(row('Light').getByRole('button', { name: m.trash.deleteForever }));
		await userEvent.click(page.getByRole('button', { name: m.trash.deleteForever }).last());

		await expect.element(page.getByText(m.common.network)).toBeInTheDocument();
		expect(onmessage).not.toHaveBeenCalled();
	});

	it('closes the dialog without deleting when the learner cancels', async () => {
		render(ArchivedExhibitions, { exhibitions: [light], covers: [], onmessage: vi.fn() });

		await userEvent.click(row('Light').getByRole('button', { name: m.trash.deleteForever }));
		await userEvent.click(page.getByRole('button', { name: m.common.cancel }));

		expect(remove).not.toHaveBeenCalled();
		await expect.element(row('Light')).toBeInTheDocument();
	});
});
