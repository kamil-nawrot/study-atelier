import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	deleteSymbol,
	loadSymbol,
	loadSymbolAtlas,
	loadSymbolPins,
	saveSymbol,
	searchArtworkContexts
} from './symbols-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));
vi.mock('#lib/images/own-image-data/own-image-data.ts', () => ({ ownImageUrls: vi.fn() }));

const SKULL = '00000000-0000-4000-8000-000000000001';

const query = {
	select: vi.fn(),
	delete: vi.fn(),
	eq: vi.fn(),
	order: vi.fn(),
	maybeSingle: vi.fn(),
	abortSignal: vi.fn()
};

const image = {
	source_wikidata_id: null,
	source_image_file: null,
	source_image_licence: null,
	source_image_licence_url: null,
	source_image_attribution: null,
	own_image_path: 'owner/jerome.jpg',
	own_image_url: null,
	image_width: 1200,
	image_height: 800
};

function chain(result: unknown): void {
	for (const method of ['select', 'delete', 'eq'] as const) query[method].mockReturnValue(query);
	let orders = 0;
	query.order.mockImplementation(() => (++orders === 2 ? Promise.resolve(result) : query));
	query.maybeSingle.mockResolvedValue(result);
	vi.mocked(supabase.from).mockReturnValue(query as never);
}

describe('symbols data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(ownImageUrls).mockResolvedValue(
			new Map([['owner/crop.jpg', 'https://storage.test/crop']])
		);
	});

	it('reads the atlas with a lens of the newest detail', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({
			data: [
				{
					id: SKULL,
					name: 'Skull',
					created_at: '2026-11-01T10:00:00Z',
					first_meaning: 'transience',
					meaning_count: 2,
					pin_count: 3,
					cover: {
						...image,
						pin_id: 'pin-1',
						artwork_id: 'artwork-1',
						image_id: 'image-1',
						x: 0.5,
						y: 0.5,
						view_width: 0.2,
						crop_path: 'owner/crop.jpg'
					}
				},
				{
					id: 'lily',
					name: 'Lily',
					created_at: '2026-11-02T10:00:00Z',
					first_meaning: null,
					meaning_count: 0,
					pin_count: 0,
					cover: null
				}
			],
			error: null
		} as never);

		const { symbols } = await loadSymbolAtlas();

		expect(supabase.rpc).toHaveBeenCalledWith('symbol_atlas');
		expect(symbols[0]).toMatchObject({
			id: SKULL,
			firstMeaning: 'transience',
			meaningCount: 2,
			pinCount: 3,
			cover: { crop: 'https://storage.test/crop' }
		});
		expect(symbols[1].cover).toBeUndefined();
		expect(symbols[1].firstMeaning).toBeUndefined();
	});

	it('reports an atlas that did not load', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({
			data: null,
			error: { message: 'Failed to fetch' }
		} as never);

		await expect(loadSymbolAtlas()).resolves.toEqual({ symbols: [], error: m.common.network });
	});

	it('reads a symbol with its meanings and labels in order', async () => {
		chain({
			data: {
				id: SKULL,
				name: 'Skull',
				symbol_meanings: [
					{ id: 'm2', position: 1, text: 'penance', symbol_meaning_contexts: [] },
					{
						id: 'm1',
						position: 0,
						text: 'transience',
						symbol_meaning_contexts: [
							{
								position: 1,
								value_id: null,
								era_code: null,
								artwork_id: null,
								glossary_entry_id: null,
								text: 'vanitas',
								category_values: null,
								artworks: null,
								glossary_entries: null
							},
							{
								position: 0,
								value_id: null,
								era_code: 'modern',
								artwork_id: null,
								glossary_entry_id: null,
								text: null,
								category_values: null,
								artworks: null,
								glossary_entries: null
							}
						]
					}
				]
			},
			error: null
		});

		const { symbol } = await loadSymbol(SKULL);

		expect(symbol?.meanings.map((meaning) => meaning.text)).toEqual(['transience', 'penance']);
		expect(symbol?.meanings[0].contexts.map((context) => context.name)).toEqual([
			m.eras.modern.name,
			'vanitas'
		]);
	});

	it('finds no symbol under an id that is not one', async () => {
		await expect(loadSymbol('skull')).resolves.toEqual({ notFound: true });
		chain({ data: null, error: null });
		await expect(loadSymbol(SKULL)).resolves.toEqual({ notFound: true });
	});

	it('reads the pins of a symbol, with a fragment only for a pin with a view', async () => {
		chain({
			data: [
				{
					id: 'pin-1',
					x: 0.4,
					y: 0.6,
					text: null,
					view_width: 0.1,
					crop_path: 'owner/crop.jpg',
					symbol_meaning_id: 'm1',
					artwork_images: { ...image, id: 'image-1', artwork_id: 'artwork-1' }
				},
				{
					id: 'pin-2',
					x: 0.4,
					y: 0.6,
					text: 'A skull',
					view_width: null,
					crop_path: null,
					symbol_meaning_id: null,
					artwork_images: { ...image, id: 'image-2', artwork_id: 'artwork-2' }
				}
			],
			error: null
		});

		const { pins } = await loadSymbolPins(SKULL);

		expect(query.eq).toHaveBeenCalledWith('symbol_id', SKULL);
		expect(pins[0]).toMatchObject({
			pinId: 'pin-1',
			artworkId: 'artwork-1',
			meaningId: 'm1',
			fragment: { cropPath: 'owner/crop.jpg', viewWidth: 0.1 }
		});
		expect(pins[1]).toEqual({ pinId: 'pin-2', artworkId: 'artwork-2', meaningId: null });
	});

	it('saves a symbol with trimmed meanings and one target per label', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ data: SKULL, error: null } as never);

		const result = await saveSymbol(
			{
				name: ' Skull ',
				meanings: [
					{
						key: 'm1',
						id: 'm1',
						text: ' transience ',
						contexts: [{ kind: 'person', entryId: 't1', name: 'Saint Jerome' }]
					}
				]
			},
			SKULL
		);

		expect(result).toEqual({ id: SKULL });
		expect(supabase.rpc).toHaveBeenCalledWith('save_symbol', {
			new_name: 'Skull',
			new_meanings: [{ id: 'm1', text: 'transience', contexts: [{ glossary_entry_id: 't1' }] }],
			symbol_id: SKULL
		});
	});

	it('tells a taken name apart from other failures', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: '23505' } } as never);
		await expect(saveSymbol({ name: 'Skull', meanings: [] })).resolves.toEqual({
			nameTaken: true
		});

		vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { code: '23514' } } as never);
		await expect(saveSymbol({ name: 'Skull', meanings: [] })).resolves.toEqual({
			error: m.symbols.errors.invalid
		});
		expect(supabase.rpc).toHaveBeenLastCalledWith('save_symbol', {
			new_name: 'Skull',
			new_meanings: []
		});
	});

	it('deletes a symbol', async () => {
		chain({ error: null });
		query.eq.mockResolvedValue({ error: null });

		await expect(deleteSymbol(SKULL)).resolves.toEqual({});
		expect(query.delete).toHaveBeenCalled();
	});

	it('finds artworks to label a meaning with', async () => {
		query.abortSignal.mockResolvedValue({
			data: [
				{ kind: 'artwork', id: 'artwork-1', record_number: 12, title: 'The Ambassadors' },
				{ kind: 'author', id: 'v1', record_number: null, title: 'Holbein' }
			],
			error: null
		});
		vi.mocked(supabase.rpc).mockReturnValue(query as never);

		const found = await searchArtworkContexts('amba', new AbortController().signal);

		expect(supabase.rpc).toHaveBeenCalledWith('note_link_suggestions', {
			link_trigger: '#',
			phrase: 'amba'
		});
		expect(found).toEqual([
			{ kind: 'artwork', artworkId: 'artwork-1', number: 12, name: 'The Ambassadors' }
		]);

		query.abortSignal.mockResolvedValue({ data: null, error: { message: 'x' } });
		await expect(searchArtworkContexts('amba', new AbortController().signal)).resolves.toEqual([]);
	});
});
