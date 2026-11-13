import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	countTermPins,
	createPin,
	deletePin,
	loadArtworkPins,
	loadEntryPins,
	movePin,
	pinDraftError,
	updatePin
} from './pin-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const query = {
	select: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	in: vi.fn(),
	eq: vi.fn(),
	order: vi.fn(),
	range: vi.fn(),
	single: vi.fn()
};

const row = {
	id: 'pin-1',
	image_id: 'image-1',
	x: 0.25,
	y: 0.5,
	glossary_entry_id: 'term-1',
	text: null
};

function entryPinRow(
	id: string,
	artworkId: string,
	extra: { view_width?: number; crop_path?: string } = {}
): Record<string, unknown> {
	return {
		id,
		x: 0.4,
		y: 0.6,
		text: 'Apsyda',
		view_width: extra.view_width ?? null,
		crop_path: extra.crop_path ?? null,
		artwork_images: {
			id: 'image-1',
			artwork_id: artworkId,
			source_wikidata_id: null,
			source_image_file: null,
			source_image_licence: null,
			source_image_licence_url: null,
			source_image_attribution: null,
			own_image_path: 'owner/main.jpg',
			own_image_url: null,
			image_width: 800,
			image_height: 600
		}
	};
}

describe('pin data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		for (const name of ['select', 'insert', 'update', 'delete', 'in', 'order']) {
			query[name as keyof typeof query].mockReturnValue(query);
		}
		query.eq.mockReturnValue(query);
	});

	it('counts the pins that name a glossary entry, with a loupe view or without, and gives up quietly on an error', async () => {
		const counted = {
			select: vi.fn(() => counted),
			not: vi.fn(),
			is: vi.fn()
		};
		vi.mocked(supabase.from).mockReturnValue(counted as never);
		counted.not.mockResolvedValueOnce({ count: 3, error: null });
		counted.not.mockResolvedValueOnce({ count: null, error: { message: 'x' } });

		await expect(countTermPins()).resolves.toBe(3);
		expect(counted.not).toHaveBeenCalledWith('glossary_entry_id', 'is', null);
		expect(counted.is).not.toHaveBeenCalled();
		await expect(countTermPins()).resolves.toBeUndefined();
	});

	it('loads the pins of every image of an artwork in the order they were placed', async () => {
		query.range.mockResolvedValue({
			data: [{ ...row, artwork_images: { artworks: { record_number: 12 } } }],
			error: null
		});

		await expect(loadArtworkPins(12)).resolves.toEqual({
			pins: [
				{
					id: 'pin-1',
					imageId: 'image-1',
					x: 0.25,
					y: 0.5,
					glossaryEntryId: 'term-1',
					text: ''
				}
			]
		});
		expect(supabase.from).toHaveBeenCalledWith('artwork_pins');
		expect(query.eq).toHaveBeenCalledWith('artwork_images.artworks.record_number', 12);
		expect(query.order).toHaveBeenCalledWith('created_at');
		expect(query.order).toHaveBeenCalledWith('id');
	});

	it('says so when the pins cannot be loaded', async () => {
		query.range.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadArtworkPins(12)).resolves.toEqual({
			pins: [],
			error: m.common.network
		});
	});

	it('creates a pin with a trimmed text and no text when it is empty', async () => {
		query.single.mockResolvedValue({ data: row, error: null });
		query.select.mockReturnValue(query);

		await expect(
			createPin('image-1', { x: 0.25, y: 0.5, glossaryEntryId: 'term-1', text: '  ' })
		).resolves.toMatchObject({ pin: { id: 'pin-1', text: '' } });
		expect(query.insert).toHaveBeenCalledWith({
			image_id: 'image-1',
			x: 0.25,
			y: 0.5,
			glossary_entry_id: 'term-1',
			symbol_id: null,
			symbol_meaning_id: null,
			text: null,
			view_width: null
		});

		await createPin('image-1', { x: 0, y: 1, glossaryEntryId: null, text: ' A lily ' });
		expect(query.insert).toHaveBeenLastCalledWith({
			image_id: 'image-1',
			x: 0,
			y: 1,
			glossary_entry_id: null,
			symbol_id: null,
			symbol_meaning_id: null,
			text: 'A lily',
			view_width: null
		});
	});

	it('creates a pin that keeps only a view of the loupe', async () => {
		query.single.mockResolvedValue({ data: { ...row, text: null, view_width: 0.1 }, error: null });
		query.select.mockReturnValue(query);

		await expect(
			createPin('image-1', { x: 0.5, y: 0.4, glossaryEntryId: null, text: '', viewWidth: 0.1 })
		).resolves.toMatchObject({ pin: { id: 'pin-1', viewWidth: 0.1 } });
		expect(query.insert).toHaveBeenCalledWith({
			image_id: 'image-1',
			x: 0.5,
			y: 0.4,
			glossary_entry_id: null,
			symbol_id: null,
			symbol_meaning_id: null,
			text: null,
			view_width: 0.1
		});
	});

	it('does not send a pin without an entry and a text', async () => {
		await expect(
			createPin('image-1', { x: 0.5, y: 0.5, glossaryEntryId: null, text: ' ' })
		).resolves.toEqual({ error: m.pins.errors.empty });
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('does not send a text longer than 300 characters', () => {
		expect(pinDraftError({ x: 0, y: 0, glossaryEntryId: null, text: 'a'.repeat(301) })).toBe(
			m.pins.errors.tooLong(300)
		);
		expect(
			pinDraftError({ x: 0, y: 0, glossaryEntryId: null, text: 'a'.repeat(300) })
		).toBeUndefined();
	});

	it('says that an image holds at most 10 pins when the database refuses the eleventh', async () => {
		query.single.mockResolvedValue({
			data: null,
			error: { code: '23514', message: 'an image holds at most 10 pins', hint: 'pin_limit' }
		});

		await expect(
			createPin('image-1', { x: 0.5, y: 0.5, glossaryEntryId: null, text: 'Lily' })
		).resolves.toEqual({ error: m.pins.errors.tooMany(10) });
	});

	it('does not take another refused check for the pin limit', async () => {
		query.single.mockResolvedValue({
			data: null,
			error: { code: '23514', message: 'violates check constraint "at most"', hint: null }
		});

		await expect(
			createPin('image-1', { x: 0.5, y: 0.5, glossaryEntryId: null, text: 'Lily' })
		).resolves.toEqual({ error: m.pins.errors.empty });
	});

	it('updates a pin by its id', async () => {
		query.single.mockResolvedValue({ data: row, error: null });

		await expect(
			updatePin('pin-1', { x: 0.3, y: 0.4, glossaryEntryId: 'term-1', text: 'Lily' })
		).resolves.toMatchObject({ pin: { id: 'pin-1' } });
		expect(query.update).toHaveBeenCalledWith({
			x: 0.3,
			y: 0.4,
			glossary_entry_id: 'term-1',
			symbol_id: null,
			symbol_meaning_id: null,
			text: 'Lily',
			view_width: null
		});
		expect(query.eq).toHaveBeenCalledWith('id', 'pin-1');
	});

	it('says the pin is gone when it no longer exists', async () => {
		query.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'none' } });

		await expect(
			updatePin('pin-1', { x: 0.3, y: 0.4, glossaryEntryId: null, text: 'Lily' })
		).resolves.toEqual({ error: m.pins.errors.notFound });
	});

	it('moves a pin by changing only its place', async () => {
		query.eq.mockResolvedValue({ error: null });

		await expect(movePin('pin-1', 0.6, 0.7)).resolves.toEqual({});
		expect(query.update).toHaveBeenCalledWith({ x: 0.6, y: 0.7 });
		expect(query.eq).toHaveBeenCalledWith('id', 'pin-1');
	});

	it('deletes a pin and reports a failure', async () => {
		query.eq.mockResolvedValueOnce({ error: null });
		await expect(deletePin('pin-1')).resolves.toEqual({});
		expect(query.eq).toHaveBeenCalledWith('id', 'pin-1');

		query.eq.mockResolvedValueOnce({ error: { code: '', message: 'Failed to fetch' } });
		await expect(deletePin('pin-1')).resolves.toEqual({ error: m.common.network });
	});

	it('finds the first pin of every artwork with a glossary entry', async () => {
		query.order.mockReturnValueOnce(query).mockResolvedValueOnce({
			data: [
				entryPinRow('pin-1', 'artwork-1'),
				entryPinRow('pin-2', 'artwork-2'),
				entryPinRow('pin-3', 'artwork-1')
			],
			error: null
		});

		await expect(loadEntryPins('term-1')).resolves.toEqual({
			pins: [
				{ artworkId: 'artwork-1', pinId: 'pin-1' },
				{ artworkId: 'artwork-2', pinId: 'pin-2' }
			],
			fragments: []
		});
		expect(query.eq).toHaveBeenCalledWith('glossary_entry_id', 'term-1');
	});

	it('keeps every pin of a glossary entry with a loupe view as a fragment', async () => {
		query.order.mockReturnValueOnce(query).mockResolvedValueOnce({
			data: [
				entryPinRow('pin-1', 'artwork-1', { view_width: 0.1, crop_path: 'owner/pin-1-crop-a.jpg' }),
				entryPinRow('pin-2', 'artwork-1', { view_width: 0.2 }),
				entryPinRow('pin-3', 'artwork-2')
			],
			error: null
		});

		const { fragments } = await loadEntryPins('term-1');

		expect(fragments).toEqual([
			{
				pinId: 'pin-1',
				artworkId: 'artwork-1',
				x: 0.4,
				y: 0.6,
				viewWidth: 0.1,
				text: 'Apsyda',
				image: { kind: 'upload', path: 'owner/main.jpg', width: 800, height: 600, id: 'image-1' },
				cropPath: 'owner/pin-1-crop-a.jpg'
			},
			expect.objectContaining({ pinId: 'pin-2', viewWidth: 0.2 })
		]);
		expect(fragments[1]).not.toHaveProperty('cropPath');
	});

	it('reports a failure to find the pins of a glossary entry', async () => {
		query.order
			.mockReturnValueOnce(query)
			.mockResolvedValueOnce({ data: null, error: { code: '', message: 'Failed to fetch' } });

		await expect(loadEntryPins('term-1')).resolves.toEqual({
			pins: [],
			fragments: [],
			error: m.common.network
		});
	});
});

describe('pins with a symbol', () => {
	it('keeps the symbol and its meaning, and drops the meaning without a symbol', async () => {
		query.single.mockResolvedValue({
			data: { ...row, symbol_id: 'symbol-1', symbol_meaning_id: 'meaning-1' },
			error: null
		});

		const created = await createPin('image-1', {
			x: 0.25,
			y: 0.5,
			glossaryEntryId: null,
			symbolId: 'symbol-1',
			symbolMeaningId: 'meaning-1',
			text: ''
		});
		await createPin('image-1', {
			x: 0.25,
			y: 0.5,
			glossaryEntryId: 'term-1',
			symbolId: null,
			symbolMeaningId: 'meaning-1',
			text: ''
		});

		expect(created.pin).toMatchObject({ symbolId: 'symbol-1', symbolMeaningId: 'meaning-1' });
		expect(query.insert).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({ symbol_id: 'symbol-1', symbol_meaning_id: 'meaning-1' })
		);
		expect(query.insert).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ symbol_id: null, symbol_meaning_id: null })
		);
	});

	it('accepts a pin that has only a symbol', () => {
		expect(
			pinDraftError({ x: 0, y: 0, glossaryEntryId: null, symbolId: 'symbol-1', text: '' })
		).toBeUndefined();
	});
});
