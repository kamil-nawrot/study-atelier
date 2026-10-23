import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/supabase.ts';
import { downloadOwnImage, ownImagePaths, readAtelier } from './export-data.ts';
import { EXPORT_TABLES } from './tables.ts';

const storage = vi.hoisted(() => ({ download: vi.fn() }));

vi.mock('#lib/supabase.ts', () => ({
	supabase: { from: vi.fn(), storage: { from: vi.fn(() => storage) }, auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

function table(rows: unknown[], error: unknown = null, calls: string[] = []): unknown {
	const query = {
		select: () => query,
		not: () => query,
		order: (column: string) => {
			calls.push(column);
			return query;
		},
		range: () => Promise.resolve({ data: rows, error })
	};
	return query;
}

beforeEach(() => vi.clearAllMocks());

describe('readAtelier', () => {
	it('reads every table in a stable order and leaves the owner out', async () => {
		const orders: string[] = [];
		from.mockImplementation(((name: string) =>
			table(
				name === 'artworks' ? [{ id: 'a', owner_id: 'u', title: 'T' }] : [],
				null,
				orders
			)) as never);

		const result = await readAtelier();

		expect(result.error).toBeUndefined();
		expect('data' in result && result.data.artworks).toEqual([{ id: 'a', title: 'T' }]);
		expect('data' in result && Object.keys(result.data)).toEqual(
			EXPORT_TABLES.map((spec) => spec.table)
		);
		expect(orders).toContain('position');
	});

	it('gives up with a message when a table cannot be read', async () => {
		from.mockImplementation((() => table([], { code: '500', message: 'x', status: 500 })) as never);

		expect(await readAtelier()).toEqual({ error: expect.any(String) });
	});
});

describe('ownImagePaths', () => {
	it('lists own files with their thumbnails and the avatar alone, once each', () => {
		const paths = ownImagePaths({
			artworks: [{ own_image_path: 'u/a.jpg' }, { own_image_path: null }],
			artwork_images: [{ own_image_path: 'u/a.jpg' }, { own_image_path: 'u/b.png' }],
			profiles: [{ avatar_path: 'u/avatar-1.jpg' }]
		});

		expect(paths).toEqual([
			'u/a.jpg',
			'u/a-thumb.jpg',
			'u/b.png',
			'u/b-thumb.jpg',
			'u/avatar-1.jpg'
		]);
	});
});

describe('downloadOwnImage', () => {
	it('returns the bytes, or null when the file is missing', async () => {
		storage.download.mockResolvedValueOnce({ data: new Blob([new Uint8Array([7])]), error: null });
		storage.download.mockResolvedValueOnce({ data: null, error: { message: 'x' } });

		expect([...((await downloadOwnImage('u/a.jpg')) ?? [])]).toEqual([7]);
		expect(await downloadOwnImage('u/missing.jpg')).toBeNull();
	});
});
