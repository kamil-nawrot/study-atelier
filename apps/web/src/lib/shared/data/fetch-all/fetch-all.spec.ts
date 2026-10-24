import { describe, expect, it, vi } from 'vitest';
import { fetchAll } from './fetch-all.ts';

describe('fetchAll', () => {
	it('reads pages of 1000 rows until a shorter page arrives', async () => {
		const page = vi.fn(async (from: number, to: number) => ({
			data: Array.from({ length: from === 0 ? to - from + 1 : 2 }, (_, index) => from + index),
			error: null
		}));
		const { rows, error } = await fetchAll<number>(page);
		expect(error).toBeUndefined();
		expect(rows).toHaveLength(1002);
		expect(page.mock.calls).toEqual([
			[0, 999],
			[1000, 1999]
		]);
	});

	it('returns no rows and the error when a page fails', async () => {
		const failure = { code: 'PGRST000', message: 'down' };
		const { rows, error } = await fetchAll<number>(async (from) =>
			from === 0
				? { data: Array.from({ length: 1000 }, () => 1), error: null }
				: { data: null, error: failure }
		);
		expect(rows).toEqual([]);
		expect(error).toBe(failure);
	});
});
