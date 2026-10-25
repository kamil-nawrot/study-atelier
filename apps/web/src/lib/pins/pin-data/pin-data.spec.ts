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

describe('pin data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		for (const name of ['select', 'insert', 'update', 'delete', 'in', 'order']) {
			query[name as keyof typeof query].mockReturnValue(query);
		}
		query.eq.mockReturnValue(query);
	});

	it('counts the pins that name a glossary entry, and gives up quietly on an error', async () => {
		const counted = {
			select: vi.fn(() => counted),
			not: vi.fn(() => counted),
			is: vi.fn()
		};
		vi.mocked(supabase.from).mockReturnValue(counted as never);
		counted.is.mockResolvedValueOnce({ count: 3, error: null });
		counted.is.mockResolvedValueOnce({ count: null, error: { message: 'x' } });

		await expect(countTermPins()).resolves.toBe(3);
		expect(counted.not).toHaveBeenCalledWith('glossary_entry_id', 'is', null);
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
			text: null,
			view_width: null
		});

		await createPin('image-1', { x: 0, y: 1, glossaryEntryId: null, text: ' A lily ' });
		expect(query.insert).toHaveBeenLastCalledWith({
			image_id: 'image-1',
			x: 0,
			y: 1,
			glossary_entry_id: null,
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
				{ id: 'pin-1', artwork_images: { artwork_id: 'artwork-1' } },
				{ id: 'pin-2', artwork_images: { artwork_id: 'artwork-2' } },
				{ id: 'pin-3', artwork_images: { artwork_id: 'artwork-1' } }
			],
			error: null
		});

		await expect(loadEntryPins('term-1')).resolves.toEqual({
			pins: [
				{ artworkId: 'artwork-1', pinId: 'pin-1' },
				{ artworkId: 'artwork-2', pinId: 'pin-2' }
			]
		});
		expect(query.eq).toHaveBeenCalledWith('glossary_entry_id', 'term-1');
	});

	it('reports a failure to find the pins of a glossary entry', async () => {
		query.order
			.mockReturnValueOnce(query)
			.mockResolvedValueOnce({ data: null, error: { code: '', message: 'Failed to fetch' } });

		await expect(loadEntryPins('term-1')).resolves.toEqual({
			pins: [],
			error: m.common.network
		});
	});
});
