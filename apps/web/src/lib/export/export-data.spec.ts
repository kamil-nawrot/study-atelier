import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { downloadOwnImage, ownImagePaths, readAtelier } from './export-data.ts';
import { EXPORT_TABLES } from './tables.ts';

const storage = vi.hoisted(() => ({ download: vi.fn() }));

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
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
	it('returns the bytes of a file', async () => {
		storage.download.mockResolvedValueOnce({ data: new Blob([new Uint8Array([7])]), error: null });

		const download = await downloadOwnImage('u/a.jpg');

		expect('bytes' in download && [...download.bytes]).toEqual([7]);
	});

	it('says a file is missing when the bucket does not have it', async () => {
		storage.download.mockResolvedValueOnce({
			data: null,
			error: { message: 'Object not found', status: 400, statusCode: '404' }
		});
		storage.download.mockResolvedValueOnce({ data: null, error: { message: 'x', status: 404 } });

		expect(await downloadOwnImage('u/missing.jpg')).toEqual({ missing: true });
		expect(await downloadOwnImage('u/missing-thumb.jpg')).toEqual({ missing: true });
	});

	it('returns the error when a file cannot be downloaded', async () => {
		const error = { message: 'Failed to fetch' };
		storage.download.mockResolvedValueOnce({ data: null, error });

		expect(await downloadOwnImage('u/a.jpg')).toEqual({ error });
	});
});
