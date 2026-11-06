import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadRelations } from './relations-data.ts';

const calls = vi.hoisted(() => ({
	filters: [] as string[],
	rpcs: [] as { name: string; args: unknown }[]
}));

vi.mock('#lib/shared/data/supabase/supabase.ts', () => {
	function query(table: string): Record<string, unknown> {
		const builder = {
			select: () => builder,
			eq: (column: string, value: unknown) => (
				calls.filters.push(`${table}.${column}=${value}`),
				builder
			),
			gte: (column: string, value: unknown) => (
				calls.filters.push(`${table}.${column}>=${value}`),
				builder
			),
			or: (filter: string) => (calls.filters.push(`${table}.or=${filter}`), builder),
			neq: (column: string, value: unknown) => (
				calls.filters.push(`${table}.${column}!=${value}`),
				builder
			),
			order: () => builder,
			range: () => builder,
			then: (resolve: (value: unknown) => void) =>
				resolve({
					data: [
						{
							id: 'e1',
							name: 'Odkrycie Ameryki',
							year_from: null,
							year_to: 1492,
							year_approximate: false
						}
					],
					error: null
				})
		};
		return builder;
	}
	function rpc(name: string, args: unknown): Promise<unknown> {
		calls.rpcs.push({ name, args });
		return Promise.resolve({ data: 1, error: null });
	}
	return { supabase: { from: query, rpc } };
});

describe('loadRelations', () => {
	beforeEach(() => {
		calls.filters = [];
		calls.rpcs = [];
	});

	it('reads the events of the time and the mastered artworks', async () => {
		const artworks = [
			testArtwork(1, 'Mona Lisa', { yearTo: 1503 }),
			testArtwork(2, 'Annunciation', { yearTo: 1476 })
		];

		const relations = await loadRelations({
			kind: 'event',
			artworks,
			index: { values: [], periodEras: [], stylePeriods: [] },
			bounds: { from: 1450, to: 1520 },
			eventId: 'self'
		});

		expect(relations.mastered).toBe(1);
		expect(relations.total).toBe(2);
		expect(relations.events?.map((event) => event.name)).toEqual(['Odkrycie Ameryki']);
		expect(calls.filters).toContain('timeline_events.year_to>=1450');
		expect(calls.filters).toContain('timeline_events.id!=self');
		expect(calls.rpcs).toEqual([
			{ name: 'mastered_artworks', args: { artwork_ids: artworks.map((artwork) => artwork.id) } }
		]);
	});

	it('reads no events for a material', async () => {
		const relations = await loadRelations({
			kind: 'material',
			artworks: [],
			index: { values: [], periodEras: [], stylePeriods: [] }
		});

		expect(relations.events).toBeUndefined();
		expect(relations.mastered).toBe(0);
		expect(calls.filters).toEqual([]);
		expect(calls.rpcs).toEqual([]);
	});
});
