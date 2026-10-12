import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import {
	emptyArtworkInput,
	loadArtwork,
	saveArtwork,
	validateArtwork,
	type ArtworkInput
} from './artwork-record.ts';

vi.mock('#lib/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

const rpcCall = { single: vi.fn() };
const query = {
	select: vi.fn(),
	eq: vi.fn(),
	is: vi.fn(),
	maybeSingle: vi.fn()
};

function input(overrides: Partial<ArtworkInput> = {}): ArtworkInput {
	return {
		...emptyArtworkInput(),
		title: 'The Test Painting',
		authors: ['Test Painter'],
		...overrides
	};
}

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'artwork-1',
		record_number: 7,
		title: 'The Test Painting',
		author_unknown: false,
		year: null,
		year_approximate: false,
		type_code: null,
		notes: null,
		source_wikidata_id: null,
		source_image_file: null,
		source_image_licence: null,
		source_image_licence_url: null,
		source_image_attribution: null,
		own_image_path: null,
		own_image_url: null,
		image_width: null,
		image_height: null,
		artwork_values: [],
		...overrides
	};
}

function value(category_code: string, name: string, position: number): Record<string, unknown> {
	return { position, category_values: { category_code, name } };
}

describe('validateArtwork', () => {
	it('accepts a title with an author', () => {
		expect(validateArtwork(input())).toEqual({});
	});

	it('asks for a title that is more than spaces', () => {
		expect(validateArtwork(input({ title: '   ' }))).toEqual({
			title: m.artworkErrors.titleRequired
		});
	});

	it('asks for an author unless the author is unknown', () => {
		expect(validateArtwork(input({ authors: [' '] }))).toEqual({
			authors: m.artworkErrors.authorRequired
		});
		expect(validateArtwork(input({ authors: [], authorUnknown: true }))).toEqual({});
	});

	it('asks for a year when it is marked as before the common era or approximate', () => {
		expect(validateArtwork(input({ beforeCommonEra: true }))).toEqual({
			year: m.artworkErrors.yearRequired
		});
		expect(validateArtwork(input({ yearApproximate: true }))).toEqual({
			year: m.artworkErrors.yearRequired
		});
	});

	it('rejects a year that is not a whole number from 1', () => {
		for (const year of [0, -5, 1.5]) {
			expect(validateArtwork(input({ year }))).toEqual({ year: m.artworkErrors.yearInvalid });
		}
	});
});

describe('saveArtwork', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockReturnValue(rpcCall as never);
		rpcCall.single.mockResolvedValue({
			data: { id: 'artwork-1', record_number: 7 },
			error: null
		});
	});

	it('saves the artwork and its values in one call and returns the record number', async () => {
		await expect(
			saveArtwork(
				input({
					title: '  The Test Painting ',
					authors: ['First Author', ' Second Author '],
					year: 480,
					beforeCommonEra: true,
					yearApproximate: true,
					typeCode: 'sculpture',
					periods: ['Classical'],
					styles: [],
					materials: ['Marble', ''],
					location: 'Test Museum',
					notes: ' Seen in class. '
				})
			)
		).resolves.toEqual({ saved: true, id: 'artwork-1', number: 7 });

		expect(supabase.rpc).toHaveBeenCalledWith('save_artwork', {
			artwork: {
				title: 'The Test Painting',
				author_unknown: false,
				year: -480,
				year_approximate: true,
				type_code: 'sculpture',
				notes: 'Seen in class.',
				source_wikidata_id: null,
				source_image_file: null,
				source_image_licence: null,
				source_image_licence_url: null,
				source_image_attribution: null,
				own_image_path: null,
				own_image_url: null,
				image_width: null,
				image_height: null
			},
			values_by_category: {
				author: ['First Author', 'Second Author'],
				period: ['Classical'],
				style: [],
				material: ['Marble'],
				location: ['Test Museum']
			},
			existing_id: null
		});
	});

	it('updates an existing artwork by its id', async () => {
		await saveArtwork(input(), 'artwork-1');

		expect(supabase.rpc).toHaveBeenCalledWith(
			'save_artwork',
			expect.objectContaining({ existing_id: 'artwork-1' })
		);
	});

	it('sends no authors when the author is unknown', async () => {
		await saveArtwork(input({ authors: ['Leftover Author'], authorUnknown: true }));

		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.artwork).toMatchObject({ author_unknown: true });
		expect(args.values_by_category).toMatchObject({ author: [] });
	});

	it('stores a Commons image with its licence and size', async () => {
		await saveArtwork(
			input({
				image: {
					kind: 'commons',
					wikidataId: 'Q1',
					file: 'Test painting.jpg',
					licence: 'Public domain',
					licenceUrl: null,
					attribution: 'Test Painter',
					width: 800,
					height: 1000
				}
			})
		);

		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.artwork).toMatchObject({
			source_wikidata_id: 'Q1',
			source_image_file: 'Test painting.jpg',
			source_image_licence: 'Public domain',
			source_image_attribution: 'Test Painter',
			own_image_path: null,
			own_image_url: null,
			image_width: 800,
			image_height: 1000
		});
	});

	it('stores an own image from a URL instead of a Commons image', async () => {
		await saveArtwork(
			input({ image: { kind: 'url', url: 'https://example.com/a.jpg', width: 3, height: 2 } })
		);

		const [, args] = vi.mocked(supabase.rpc).mock.calls[0] as [string, Record<string, never>];
		expect(args.artwork).toMatchObject({
			source_wikidata_id: null,
			source_image_file: null,
			own_image_url: 'https://example.com/a.jpg',
			image_width: 3,
			image_height: 2
		});
	});

	it('does not call the database when a required field is missing', async () => {
		await expect(saveArtwork(input({ title: '' }))).resolves.toEqual({
			saved: false,
			fieldErrors: { title: m.artworkErrors.titleRequired }
		});
		expect(supabase.rpc).not.toHaveBeenCalled();
	});

	it('returns the dictionary message for a database error', async () => {
		rpcCall.single.mockResolvedValue({
			data: null,
			error: { code: 'P0002', message: 'artwork not found' }
		});

		await expect(saveArtwork(input(), 'artwork-1')).resolves.toEqual({
			saved: false,
			error: m.artworkErrors.notFound,
			fieldErrors: {}
		});
	});
});

describe('loadArtwork', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.select.mockReturnValue(query);
		query.eq.mockReturnValue(query);
		query.is.mockReturnValue(query);
	});

	it('asks for the artwork by record number outside the trash', async () => {
		query.maybeSingle.mockResolvedValue({ data: row(), error: null });

		await loadArtwork(7);

		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.eq).toHaveBeenCalledWith('record_number', 7);
		expect(query.is).toHaveBeenCalledWith('deleted_at', null);
	});

	it('returns every field with values grouped by category in their order', async () => {
		query.maybeSingle.mockResolvedValue({
			data: row({
				year: -480,
				year_approximate: true,
				type_code: 'sculpture',
				notes: 'Seen in class.',
				artwork_values: [
					value('author', 'Second Author', 1),
					value('style', 'Classical', 0),
					value('author', 'First Author', 0),
					value('location', 'Test Museum', 0),
					value('material', 'Bronze', 1),
					value('material', 'Marble', 0)
				]
			}),
			error: null
		});

		await expect(loadArtwork(7)).resolves.toEqual({
			artwork: {
				id: 'artwork-1',
				number: 7,
				title: 'The Test Painting',
				authors: ['First Author', 'Second Author'],
				authorUnknown: false,
				year: 480,
				beforeCommonEra: true,
				yearApproximate: true,
				typeCode: 'sculpture',
				periods: [],
				styles: ['Classical'],
				materials: ['Marble', 'Bronze'],
				location: 'Test Museum',
				notes: 'Seen in class.',
				image: null
			}
		});
	});

	it('reads an uploaded image before a Commons image', async () => {
		query.maybeSingle.mockResolvedValue({
			data: row({
				source_wikidata_id: 'Q1',
				source_image_file: 'Test painting.jpg',
				own_image_path: 'user-id/artwork-1/photo.jpg',
				image_width: 4,
				image_height: 3
			}),
			error: null
		});

		const { artwork } = await loadArtwork(7);

		expect(artwork?.image).toEqual({
			kind: 'upload',
			path: 'user-id/artwork-1/photo.jpg',
			width: 4,
			height: 3
		});
	});

	it('reads a Commons image with its licence', async () => {
		query.maybeSingle.mockResolvedValue({
			data: row({
				source_wikidata_id: 'Q1',
				source_image_file: 'Test painting.jpg',
				source_image_licence: 'CC BY-SA 4.0',
				source_image_licence_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
				source_image_attribution: 'Test Photographer'
			}),
			error: null
		});

		const { artwork } = await loadArtwork(7);

		expect(artwork?.image).toEqual({
			kind: 'commons',
			wikidataId: 'Q1',
			file: 'Test painting.jpg',
			licence: 'CC BY-SA 4.0',
			licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
			attribution: 'Test Photographer',
			width: null,
			height: null
		});
	});

	it('says the artwork is missing when no row matches', async () => {
		query.maybeSingle.mockResolvedValue({ data: null, error: null });

		await expect(loadArtwork(99)).resolves.toEqual({ error: m.artworkErrors.notFound });
	});

	it('returns the dictionary message for a failed request', async () => {
		query.maybeSingle.mockResolvedValue({
			data: null,
			error: { code: '', message: 'TypeError: Failed to fetch' }
		});

		await expect(loadArtwork(7)).resolves.toEqual({ error: m.artworkErrors.network });
	});
});
