import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	BLANK_DOCUMENT,
	archiveExhibition,
	createExhibition,
	deleteExhibition,
	loadExhibition,
	loadExhibitionSummaries,
	restoreExhibition,
	saveExhibition
} from './exhibition-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);
const rpc = vi.mocked(supabase.rpc);

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

function chain(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'order', 'eq', 'is', 'not', 'update', 'delete']) {
		query[name] = vi.fn().mockReturnValue(query);
	}
	for (const name of ['range', 'maybeSingle']) {
		query[name] = vi.fn().mockResolvedValue(result);
	}
	query.then = vi.fn((resolve: (value: unknown) => unknown) => resolve(result));
	from.mockReturnValue(query as never);
	return query;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('loadExhibitionSummaries', () => {
	it('summarises each exhibition with its number of artworks and its cover', async () => {
		const query = chain({
			data: [
				{
					id: ID,
					title: 'Light',
					updated_at: '2026-11-01T10:00:00Z',
					deleted_at: null,
					exhibition_artworks: [
						{ artwork_id: 'b', position: 1 },
						{ artwork_id: 'a', position: 0 }
					]
				}
			],
			error: null
		});

		const { exhibitions, error } = await loadExhibitionSummaries(false);

		expect(error).toBeUndefined();
		expect(exhibitions).toEqual([
			{
				id: ID,
				title: 'Light',
				updatedAt: '2026-11-01T10:00:00Z',
				deletedAt: null,
				artworkCount: 2,
				coverId: 'a'
			}
		]);
		expect(query.is).toHaveBeenCalledWith('deleted_at', null);
	});

	it('reads only the archived exhibitions when asked for them', async () => {
		const query = chain({ data: [], error: null });

		await loadExhibitionSummaries(true);

		expect(query.not).toHaveBeenCalledWith('deleted_at', 'is', null);
	});

	it('reports a failure', async () => {
		chain({ data: null, error: { message: 'Failed to fetch' } });

		const { exhibitions, error } = await loadExhibitionSummaries(false);

		expect(exhibitions).toEqual([]);
		expect(error).toBe(m.common.network);
	});
});

describe('loadExhibition', () => {
	it('returns the exhibition with its document and revision', async () => {
		chain({
			data: {
				id: ID,
				title: 'Light',
				document: BLANK_DOCUMENT,
				revision: 4,
				updated_at: '2026-11-01T10:00:00Z'
			},
			error: null
		});

		const { exhibition } = await loadExhibition(ID);

		expect(exhibition).toEqual({
			id: ID,
			title: 'Light',
			document: BLANK_DOCUMENT,
			revision: 4,
			updatedAt: '2026-11-01T10:00:00Z'
		});
	});

	it('returns nothing for an exhibition that is not there', async () => {
		chain({ data: null, error: null });

		expect(await loadExhibition(ID)).toEqual({});
	});

	it('reports a failure', async () => {
		chain({ data: null, error: { code: 'PGRST116', message: '' } });

		expect((await loadExhibition(ID)).error).toBe(m.exhibitions.errors.notFound);
	});
});

describe('saveExhibition', () => {
	it('sends the title, the document and the revision it saves over', async () => {
		rpc.mockResolvedValue({ data: 5, error: null } as never);

		const result = await saveExhibition(ID, 'Light', BLANK_DOCUMENT, 4);

		expect(result).toEqual({ revision: 5 });
		expect(rpc).toHaveBeenCalledWith('save_exhibition', {
			exhibition_id: ID,
			new_title: 'Light',
			new_document: BLANK_DOCUMENT,
			expected_revision: 4
		});
	});

	it('leaves out the revision when it creates the exhibition', async () => {
		rpc.mockResolvedValue({ data: 1, error: null } as never);

		await saveExhibition(ID, '', BLANK_DOCUMENT, null);

		expect(rpc.mock.calls[0][1]).not.toHaveProperty('expected_revision');
	});

	it('tells a conflict from a failure', async () => {
		rpc.mockResolvedValueOnce({
			data: null,
			error: { code: '40001', hint: 'exhibition_revision', message: '' }
		} as never);
		expect(await saveExhibition(ID, 'x', BLANK_DOCUMENT, 1)).toEqual({ conflict: true });

		rpc.mockResolvedValueOnce({
			data: null,
			error: { code: '23514', message: '' }
		} as never);
		expect(await saveExhibition(ID, 'x', BLANK_DOCUMENT, 1)).toEqual({
			error: m.exhibitions.errors.invalid
		});
	});
});

describe('moving between the list and Archiwum', () => {
	it('archives with the time of the move and restores with null', async () => {
		const query = chain({ error: null });

		await archiveExhibition(ID, new Date('2026-11-02T08:00:00Z'));
		expect(query.update).toHaveBeenLastCalledWith({ deleted_at: '2026-11-02T08:00:00.000Z' });

		await restoreExhibition(ID);
		expect(query.update).toHaveBeenLastCalledWith({ deleted_at: null });
	});

	it('deletes for good and reports a failure', async () => {
		const query = chain({ error: null });
		expect(await deleteExhibition(ID)).toEqual({});
		expect(query.delete).toHaveBeenCalled();

		chain({ error: { message: 'Failed to fetch' } });
		expect((await deleteExhibition(ID)).error).toBe(m.common.network);
	});
});

describe('createExhibition', () => {
	it('creates an empty exhibition under a new id', async () => {
		rpc.mockResolvedValue({ data: 1, error: null } as never);

		const { id, error } = await createExhibition();

		expect(error).toBeUndefined();
		expect(rpc.mock.calls[0][1]).toMatchObject({
			exhibition_id: id,
			new_title: '',
			new_document: BLANK_DOCUMENT
		});
	});

	it('reports why it could not', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { code: 'P0001', message: '', hint: 'exhibitions' }
		} as never);

		const { id, error } = await createExhibition();

		expect(id).toBeUndefined();
		expect(error).toBeTruthy();
	});
});
