import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { countFlags, deleteFlag, loadBrokenImages, loadFlags } from './backroom-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const rpc = vi.mocked(supabase.rpc);
const from = vi.mocked(supabase.from);

function query(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const chain: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'order', 'delete', 'not']) chain[name] = vi.fn(() => chain);
	chain.range = vi.fn().mockResolvedValue(result);
	chain.eq = vi.fn().mockResolvedValue(result);
	from.mockReturnValue(chain as never);
	return chain;
}

describe('backroom data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the flags newest first with the image number and the symbol name', async () => {
		const chain = query({
			data: [
				{
					id: 'flag-1',
					reason: 'image',
					comment: 'Blurry',
					question: null,
					artwork_id: 'artwork-1',
					term_id: null,
					symbol_id: null,
					artwork_images: { position: 1 },
					symbols: null
				},
				{
					id: 'flag-2',
					reason: 'meaning',
					comment: null,
					question: { mode: 'quiz_symbol', text: 'Co przedstawia ten detal?' },
					artwork_id: null,
					term_id: null,
					symbol_id: 'symbol-1',
					artwork_images: null,
					symbols: { name: 'Skull' }
				}
			],
			error: null
		});

		const { flags } = await loadFlags();

		expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
		expect(flags).toEqual([
			expect.objectContaining({ id: 'flag-1', imageNumber: 2, comment: 'Blurry' }),
			expect.objectContaining({ id: 'flag-2', symbolName: 'Skull', imageNumber: null })
		]);
	});

	it('says when the flags cannot be loaded', async () => {
		query({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadFlags()).resolves.toEqual({ flags: [], error: m.common.network });
	});

	it('loads the images marked broken with their artwork and position', async () => {
		const chain = query({
			data: [{ artwork_id: 'artwork-1', position: 2 }],
			error: null
		});

		await expect(loadBrokenImages()).resolves.toEqual([{ artworkId: 'artwork-1', position: 2 }]);
		expect(from).toHaveBeenCalledWith('artwork_images');
		expect(chain.not).toHaveBeenCalledWith('broken_at', 'is', null);
	});

	it('lists no broken image when they cannot be loaded', async () => {
		query({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadBrokenImages()).resolves.toEqual([]);
	});

	it('counts the flags in the database', async () => {
		rpc.mockResolvedValueOnce({ data: 3, error: null } as never);
		await expect(countFlags()).resolves.toBe(3);
		rpc.mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch' } } as never);
		await expect(countFlags()).resolves.toBeUndefined();
	});

	it('deletes a fixed flag', async () => {
		const chain = query({ error: null });

		await expect(deleteFlag('flag-1')).resolves.toEqual({});
		expect(chain.eq).toHaveBeenCalledWith('id', 'flag-1');
	});
});
