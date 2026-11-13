import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { authorRelationsFromRows, loadAuthorRelations } from './author-relations-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const leonardo = { id: 'leonardo', name: 'Leonardo' };
const verrocchio = { id: 'verrocchio', name: 'Verrocchio' };
const raphael = { id: 'raphael', name: 'Raphael' };

function query(result: unknown): { select: () => unknown; or: ReturnType<typeof vi.fn> } {
	const or = vi.fn().mockResolvedValue(result);
	const chain = { select: () => chain, or };
	vi.mocked(supabase.from).mockReturnValue(chain as never);
	return chain;
}

describe('authorRelationsFromRows', () => {
	it('reads each relation from the end the author stands on', () => {
		expect(
			authorRelationsFromRows('leonardo', [
				{ kind: 'pupil', from: leonardo, to: verrocchio },
				{ kind: 'influence', from: raphael, to: leonardo },
				{ kind: 'related', from: raphael, to: leonardo },
				{ kind: 'rival', from: raphael, to: leonardo },
				{ kind: 'pupil', from: null, to: leonardo }
			])
		).toEqual([
			{ type: 'pupilFrom', author: verrocchio },
			{ type: 'influenceTo', author: raphael },
			{ type: 'related', author: raphael }
		]);
	});
});

describe('loadAuthorRelations', () => {
	beforeEach(() => vi.clearAllMocks());

	it('asks for the relations on both ends of the author', async () => {
		const chain = query({ data: [{ kind: 'pupil', from: leonardo, to: verrocchio }], error: null });

		await expect(loadAuthorRelations('leonardo')).resolves.toEqual({
			relations: [{ type: 'pupilFrom', author: verrocchio }]
		});
		expect(supabase.from).toHaveBeenCalledWith('author_relations');
		expect(chain.or).toHaveBeenCalledWith('from_id.eq.leonardo,to_id.eq.leonardo');
	});

	it('returns an error message when the query fails', async () => {
		query({ data: null, error: { message: 'boom' } });

		const result = await loadAuthorRelations('leonardo');

		expect(result.relations).toEqual([]);
		expect(result.error).toEqual(expect.any(String));
	});
});
