import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadGlossaryEntry, loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadTimelineEventsByName } from '#lib/timeline/timeline-data/timeline-data.ts';
import { loadValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { albumWithItems } from '#lib/testing/albums/albums.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { loadItemData } from './album-items-data.ts';

vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ loadCardIndex: vi.fn() }));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({
	loadTermIndex: vi.fn(),
	loadGlossaryEntry: vi.fn()
}));
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({
	loadTimelineEventsByName: vi.fn()
}));
vi.mock('#lib/values/value-details-data/value-details-data.ts', () => ({
	loadValueDetails: vi.fn()
}));

const index = {
	...testCardIndex(),
	values: [
		{ id: 'r-carver', category: 'author' as const, name: 'unknown carver', count: 1 },
		{ id: 'r-cave', category: 'material' as const, name: 'Cave', count: 1 }
	]
};

describe('loadItemData', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(loadTermIndex).mockResolvedValue({
			terms: [
				{
					id: 'a-1',
					name: 'carving',
					kind: 'term',
					category: 'technique',
					synonyms: [],
					forms: []
				},
				{ id: 'a-2', name: 'Other', kind: 'term', category: 'technique', synonyms: [], forms: [] }
			] as never
		});
		vi.mocked(loadCardIndex).mockResolvedValue({ index, ownValues: [] });
		vi.mocked(loadTimelineEventsByName).mockResolvedValue({ events: [] });
		vi.mocked(loadGlossaryEntry).mockResolvedValue({ entry: testEntry('a-1', 'carving') });
		vi.mocked(loadValueDetails).mockResolvedValue({ details: { summary: 'Own.', notes: '' } });
	});

	it('loads what the learner already has under the names of the album', async () => {
		const data = await loadItemData(albumWithItems());

		expect(loadTimelineEventsByName).toHaveBeenCalledWith(['Discovery']);
		expect(loadGlossaryEntry).toHaveBeenCalledTimes(1);
		expect(loadGlossaryEntry).toHaveBeenCalledWith('a-1');
		expect(data.matches.entries.map((entry) => entry.id)).toEqual(['a-1']);
		expect(data.matches.records.map((record) => record.id)).toEqual(['r-carver']);
		expect(data.matches.details['r-carver']).toEqual({ summary: 'Own.', notes: '' });
		expect(data.entries).toHaveLength(2);
		expect(data.index).toBe(index);
		expect(data.error).toBeUndefined();
	});

	it('skips an entry that fails to load', async () => {
		vi.mocked(loadGlossaryEntry).mockResolvedValue({ error: 'x' });

		expect((await loadItemData(albumWithItems())).matches.entries).toEqual([]);
	});

	it.each([
		['terms', () => vi.mocked(loadTermIndex).mockResolvedValue({ terms: [], error: 'terms' })],
		[
			'card index',
			() =>
				vi.mocked(loadCardIndex).mockResolvedValue({ index, ownValues: [], error: 'card index' })
		],
		[
			'events',
			() => vi.mocked(loadTimelineEventsByName).mockResolvedValue({ events: [], error: 'events' })
		],
		[
			'details',
			() =>
				vi
					.mocked(loadValueDetails)
					.mockResolvedValue({ details: { summary: '', notes: '' }, error: 'details' })
		]
	])('reports a failure of the %s', async (message, fail) => {
		fail();

		const data = await loadItemData(albumWithItems());

		expect(data.error).toBe(message);
		expect(data.matches).toEqual({ entries: [], events: [], records: [], details: {} });
		expect(data.entries).toEqual([]);
	});
});
