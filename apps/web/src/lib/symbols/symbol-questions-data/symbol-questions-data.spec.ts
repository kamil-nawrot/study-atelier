import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadSymbolQuestionPins } from './symbol-questions-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const query = { select: vi.fn(), not: vi.fn(), is: vi.fn() };

function answer(result: unknown): void {
	query.select.mockReturnValue(query);
	query.not.mockReturnValue(query);
	query.is.mockResolvedValueOnce(result);
	vi.mocked(supabase.from).mockReturnValue(query as never);
}

const image = {
	id: 'image-1',
	artwork_id: 'artwork-1',
	source_wikidata_id: null,
	source_image_file: null,
	source_image_licence: null,
	source_image_licence_url: null,
	source_image_attribution: null,
	own_image_path: 'owner/a.jpg',
	own_image_url: null,
	image_width: 1200,
	image_height: 800
};

describe('symbol questions data', () => {
	beforeEach(() => vi.clearAllMocks());

	it('reads the pins with a symbol and a crop, with the meaning and its persons', async () => {
		answer({
			data: [
				{
					id: 'pin-1',
					x: 0.5,
					y: 0.4,
					text: null,
					view_width: 0.2,
					crop_path: 'owner/crop.jpg',
					symbols: { name: 'Keys' },
					symbol_meanings: {
						id: 'meaning-1',
						text: 'Power of the Church',
						symbol_meaning_contexts: [
							{ position: 2, glossary_entries: { name: 'Paul', category: 'person' } },
							{ position: 0, glossary_entries: { name: 'Peter', category: 'person' } },
							{ position: 1, glossary_entries: { name: 'Vanitas', category: 'general' } },
							{ position: 3, glossary_entries: null }
						]
					},
					artwork_images: image
				},
				{
					id: 'pin-2',
					x: 0.1,
					y: 0.1,
					text: 'Lily',
					view_width: 0.1,
					crop_path: 'owner/crop2.jpg',
					symbols: { name: 'Lily' },
					symbol_meanings: null,
					artwork_images: image
				}
			],
			error: null
		});

		const { pins } = await loadSymbolQuestionPins();

		expect(pins[0]).toMatchObject({
			pinId: 'pin-1',
			symbolName: 'Keys',
			meaning: { id: 'meaning-1', text: 'Power of the Church', persons: ['Peter', 'Paul'] },
			fragment: { artworkId: 'artwork-1', cropPath: 'owner/crop.jpg', viewWidth: 0.2 }
		});
		expect(pins[1].meaning).toBeUndefined();
		expect(pins[1].fragment.text).toBe('Lily');
		expect(query.is).toHaveBeenCalledWith('artwork_images.artworks.deleted_at', null);
		expect(query.select.mock.calls[0][0]).toContain('artworks!inner(deleted_at)');
	});

	it('says so when the pins cannot be loaded', async () => {
		answer({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadSymbolQuestionPins()).resolves.toEqual({
			pins: [],
			error: m.common.network
		});
	});
});
