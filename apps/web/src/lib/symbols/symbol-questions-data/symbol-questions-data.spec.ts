import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadSymbolQuestionImages, loadSymbolQuestionPins } from './symbol-questions-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const query = {
	select: vi.fn(),
	not: vi.fn(),
	is: vi.fn(),
	order: vi.fn(),
	range: vi.fn(),
	in: vi.fn()
};

function answer(result: unknown): void {
	query.range.mockReset();
	query.in.mockReset();
	query.select.mockReturnValue(query);
	query.not.mockReturnValue(query);
	query.is.mockReturnValue(query);
	query.order.mockReturnValue(query);
	query.range.mockResolvedValueOnce(result);
	query.in.mockResolvedValueOnce(result);
	vi.mocked(supabase.from).mockReturnValue(query as never);
}

function answerPins(result: unknown): void {
	answer(result);
	query.in.mockReset();
	query.in.mockReturnValue(query);
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

const pinImage = { id: 'image-1', artwork_id: 'artwork-1' };

describe('symbol questions data', () => {
	beforeEach(() => vi.clearAllMocks());

	it('reads the pins with a symbol and a crop, with the meaning and its persons', async () => {
		answerPins({
			data: [
				{
					id: 'pin-1',
					x: 0.5,
					y: 0.4,
					text: null,
					view_width: 0.2,
					crop_path: 'owner/crop.jpg',
					symbols: { id: 'symbol-keys', name: 'Keys' },
					symbol_meanings: {
						id: 'meaning-1',
						text: 'Power of the Church',
						symbol_meaning_contexts: [
							{ position: 2, glossary_entries: { name: 'Paul', kind: 'figure' } },
							{ position: 0, glossary_entries: { name: 'Peter', kind: 'figure' } },
							{ position: 1, glossary_entries: { name: 'Vanitas', kind: 'term' } },
							{ position: 3, glossary_entries: null }
						]
					},
					artwork_images: pinImage
				},
				{
					id: 'pin-2',
					x: 0.1,
					y: 0.1,
					text: 'Lily',
					view_width: 0.1,
					crop_path: 'owner/crop2.jpg',
					symbols: { id: 'symbol-lily', name: 'Lily' },
					symbol_meanings: null,
					artwork_images: pinImage
				}
			],
			error: null
		});

		const { pins } = await loadSymbolQuestionPins(['pin-1']);

		expect(query.in).toHaveBeenCalledWith('id', ['pin-1']);
		expect(pins[0]).toMatchObject({
			pinId: 'pin-1',
			symbolId: 'symbol-keys',
			symbolName: 'Keys',
			meaning: { id: 'meaning-1', text: 'Power of the Church', persons: ['Peter', 'Paul'] },
			fragment: { artworkId: 'artwork-1', cropPath: 'owner/crop.jpg', viewWidth: 0.2 }
		});
		expect(pins[1].meaning).toBeUndefined();
		expect(pins[1].fragment.text).toBe('Lily');
		expect(query.is).toHaveBeenCalledWith('artwork_images.artworks.deleted_at', null);
		expect(query.select.mock.calls[0][0]).toContain('artworks!inner(deleted_at)');
		expect(query.select.mock.calls[0][0]).not.toContain('own_image_path');
	});

	it('says so when the pins cannot be loaded', async () => {
		answerPins({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadSymbolQuestionPins(['pin-1'])).resolves.toEqual({
			pins: [],
			error: m.common.network
		});
	});

	it('reads no pins when the round picked none', async () => {
		vi.mocked(supabase.from).mockClear();

		await expect(loadSymbolQuestionPins([])).resolves.toEqual({ pins: [] });
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('reads the images of the drawn pins only', async () => {
		answer({ data: [{ id: 'pin-1', artwork_images: image }], error: null });

		const images = await loadSymbolQuestionImages(['pin-1']);

		expect(query.in).toHaveBeenCalledWith('id', ['pin-1']);
		expect(images?.get('pin-1')).toMatchObject({ kind: 'upload', path: 'owner/a.jpg' });
		await expect(loadSymbolQuestionImages([])).resolves.toEqual(new Map());
	});

	it('gives nothing when the images cannot be loaded', async () => {
		answer({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadSymbolQuestionImages(['pin-1'])).resolves.toBeUndefined();
	});
});
