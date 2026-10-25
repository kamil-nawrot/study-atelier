import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	deleteVisit,
	loadArtworkVisits,
	loadVisit,
	loadVisits,
	saveVisit
} from './chronicle-data.ts';
import type { VisitDraft } from '#lib/chronicle/types/visit-draft.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);
const rpc = vi.mocked(supabase.rpc);

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: ID,
		visited_on: '2026-10-12',
		date_precision: 'day',
		notes: 'Lilie wodne.',
		category_values: {
			name: 'Musée d’Orsay',
			location_details: [{ place_type: 'museum', country_code: 'FR' }]
		},
		visit_artworks: [{ artwork_id: 'a1' }, { artwork_id: 'a2' }],
		...overrides
	};
}

function chain(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'order', 'eq', 'delete']) {
		query[name] = vi.fn().mockReturnValue(query);
	}
	for (const name of ['range', 'maybeSingle']) {
		query[name] = vi.fn().mockResolvedValue(result);
	}
	query.then = vi.fn((resolve: (value: unknown) => unknown) => resolve(result));
	from.mockReturnValue(query as never);
	return query;
}

const draft: VisitDraft = {
	place: ' Musée d’Orsay ',
	date: { on: '2026-10-01', precision: 'month' },
	notes: '  ',
	artworkIds: ['a1']
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('loadVisits', () => {
	it('reads the place, the date and the artworks of each visit', async () => {
		const query = chain({ data: [row()], error: null });

		const result = await loadVisits();

		expect(query.order).toHaveBeenLastCalledWith('id', { ascending: false });
		expect(result.visits).toEqual([
			{
				id: ID,
				place: 'Musée d’Orsay',
				placeType: 'museum',
				countryCode: 'FR',
				date: { on: '2026-10-12', precision: 'day' },
				notes: 'Lilie wodne.',
				artworkIds: ['a1', 'a2']
			}
		]);
	});

	it('reads a place without details and a visit without a note', async () => {
		chain({
			data: [row({ notes: null, category_values: { name: 'Kościół', location_details: null } })],
			error: null
		});

		const [visit] = (await loadVisits()).visits;

		expect(visit.placeType).toBeNull();
		expect(visit.countryCode).toBeNull();
		expect(visit.notes).toBe('');
	});

	it('says when the chronicle cannot be reached', async () => {
		chain({ data: null, error: { message: 'TypeError: Failed to fetch' } });

		expect(await loadVisits()).toEqual({ visits: [], error: m.common.network });
	});
});

describe('loadArtworkVisits', () => {
	it('asks for the visits that hold the artwork, newest first', async () => {
		const query = chain({ data: [row({ visit_artworks: [{ artwork_id: 'a1' }] })], error: null });

		const result = await loadArtworkVisits(12);

		expect(query.eq).toHaveBeenCalledWith('visit_artworks.artworks.record_number', 12);
		expect(query.order).toHaveBeenCalledWith('visited_on', { ascending: false });
		expect(query.order).toHaveBeenLastCalledWith('id', { ascending: false });
		expect(result.visits.map((visit) => visit.place)).toEqual(['Musée d’Orsay']);
	});

	it('says when the visits cannot be loaded', async () => {
		chain({ data: null, error: { message: 'TypeError: Failed to fetch' } });

		expect(await loadArtworkVisits(12)).toEqual({ visits: [], error: m.common.network });
	});
});

describe('loadVisit', () => {
	it('does not ask for an address that is not an id', async () => {
		expect(await loadVisit('nope')).toEqual({ notFound: true });
		expect(from).not.toHaveBeenCalled();
	});

	it('says when the visit does not exist', async () => {
		chain({ data: null, error: null });

		expect(await loadVisit(ID)).toEqual({ notFound: true });
	});

	it('reads one visit', async () => {
		const query = chain({ data: row(), error: null });

		const result = await loadVisit(ID);

		expect(query.eq).toHaveBeenCalledWith('id', ID);
		expect(result.visit?.place).toBe('Musée d’Orsay');
	});
});

describe('saveVisit', () => {
	it('sends the visit with a trimmed place and no empty note', async () => {
		rpc.mockResolvedValue({ data: ID, error: null } as never);

		const result = await saveVisit(draft);

		expect(rpc).toHaveBeenCalledWith('save_visit', {
			visit: { visited_on: '2026-10-01', date_precision: 'month', notes: null },
			place: 'Musée d’Orsay',
			artwork_ids: ['a1']
		});
		expect(result).toEqual({ id: ID });
	});

	it('names the visit it edits', async () => {
		rpc.mockResolvedValue({ data: ID, error: null } as never);

		await saveVisit({ ...draft, notes: ' Tłum. ' }, ID);

		expect(rpc).toHaveBeenCalledWith(
			'save_visit',
			expect.objectContaining({
				visit: expect.objectContaining({ notes: 'Tłum.' }),
				existing_id: ID
			})
		);
	});

	it('maps a rejected visit to a message', async () => {
		rpc.mockResolvedValue({ data: null, error: { code: '23514', message: 'check' } } as never);

		expect(await saveVisit(draft)).toEqual({ error: m.chronicle.errors.invalid });
	});
});

describe('deleteVisit', () => {
	it('deletes the visit', async () => {
		const query = chain({ error: null });

		expect(await deleteVisit(ID)).toEqual({});
		expect(query.eq).toHaveBeenCalledWith('id', ID);
	});

	it('maps a failed delete to a message', async () => {
		chain({ error: { code: 'PGRST116', message: 'none' } });

		expect(await deleteVisit(ID)).toEqual({ error: m.chronicle.errors.notFound });
	});
});
