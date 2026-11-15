import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadReviewRelations } from './relation-questions-data.ts';

const results = vi.hoisted(() => ({
	artwork_relations: { data: [] as unknown[], error: null as unknown },
	author_relations: { data: [] as unknown[], error: null as unknown },
	filters: [] as string[]
}));

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: {
		from: (table: 'artwork_relations' | 'author_relations') => ({
			select: () => ({
				neq: (column: string, value: string) => {
					results.filters.push(`${table}.${column}!=${value}`);
					return Promise.resolve(results[table]);
				}
			})
		})
	}
}));

describe('loadReviewRelations', () => {
	beforeEach(() => {
		results.artwork_relations = { data: [], error: null };
		results.author_relations = { data: [], error: null };
		results.filters = [];
	});

	it('reads the typed relations of artworks and authors without the catch-all type', async () => {
		results.artwork_relations.data = [{ kind: 'study', from_id: 'a1', to_id: 'a2' }];
		results.author_relations.data = [
			{ kind: 'pupil', from: { name: 'Leonardo da Vinci' }, to: { name: 'Verrocchio' } },
			{ kind: 'family', from: null, to: { name: 'Holbein' } }
		];

		await expect(loadReviewRelations()).resolves.toEqual({
			artworks: [{ kind: 'study', from: 'a1', to: 'a2' }],
			authors: [{ kind: 'pupil', from: 'Leonardo da Vinci', to: 'Verrocchio' }]
		});
		expect(results.filters).toEqual([
			'artwork_relations.kind!=related',
			'author_relations.kind!=related'
		]);
	});

	it('asks nothing about relations when a read fails', async () => {
		results.author_relations = { data: [], error: { message: 'offline' } };

		await expect(loadReviewRelations()).resolves.toEqual({ artworks: [], authors: [] });
	});
});
