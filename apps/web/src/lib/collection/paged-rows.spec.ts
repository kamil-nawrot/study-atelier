import { describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { fetchAllRows, PAGE_SIZE } from './paged-rows.ts';

function rows(count: number): number[] {
	return Array.from({ length: count }, (_, index) => index);
}

describe('fetchAllRows', () => {
	it('stops after a page that is not full', async () => {
		const page = vi.fn().mockResolvedValue({ data: rows(3), error: null });

		await expect(fetchAllRows(page)).resolves.toEqual({ rows: rows(3) });
		expect(page).toHaveBeenCalledTimes(1);
		expect(page).toHaveBeenCalledWith(0, PAGE_SIZE - 1);
	});

	it('asks for the next range until a page is not full', async () => {
		const page = vi
			.fn()
			.mockResolvedValueOnce({ data: rows(PAGE_SIZE), error: null })
			.mockResolvedValueOnce({ data: rows(250), error: null });

		const { rows: all } = await fetchAllRows(page);

		expect(all).toHaveLength(PAGE_SIZE + 250);
		expect(page).toHaveBeenNthCalledWith(2, PAGE_SIZE, PAGE_SIZE * 2 - 1);
	});

	it('asks once more after a full page and stops at an empty one', async () => {
		const page = vi
			.fn()
			.mockResolvedValueOnce({ data: rows(PAGE_SIZE), error: null })
			.mockResolvedValueOnce({ data: [], error: null });

		const { rows: all } = await fetchAllRows(page);

		expect(all).toHaveLength(PAGE_SIZE);
		expect(page).toHaveBeenCalledTimes(2);
	});

	it('treats a missing page as empty', async () => {
		const page = vi.fn().mockResolvedValue({ data: null, error: null });

		await expect(fetchAllRows(page)).resolves.toEqual({ rows: [] });
	});

	it('returns no rows and a message when a later page fails', async () => {
		const page = vi
			.fn()
			.mockResolvedValueOnce({ data: rows(PAGE_SIZE), error: null })
			.mockResolvedValueOnce({
				data: null,
				error: { code: '', message: 'TypeError: Failed to fetch' }
			});

		await expect(fetchAllRows(page)).resolves.toEqual({
			rows: [],
			error: m.collectionErrors.network
		});
	});
});
