import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import {
	createPin,
	deletePin,
	loadEntryPins,
	loadPins,
	movePin,
	pinDraftError,
	updatePin
} from './pin-data.ts';

vi.mock('#lib/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

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

	it('loads the pins of several images in the order they were placed', async () => {
		query.range.mockResolvedValue({ data: [row], error: null });

		await expect(loadPins(['image-1', 'image-2'])).resolves.toEqual({
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
		expect(query.in).toHaveBeenCalledWith('image_id', ['image-1', 'image-2']);
		expect(query.order).toHaveBeenCalledWith('created_at');
		expect(query.order).toHaveBeenCalledWith('id');
	});

	it('does not ask for the pins of no image', async () => {
		await expect(loadPins([])).resolves.toEqual({ pins: [] });
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('asks for the pins of many images in batches', async () => {
		query.range.mockResolvedValue({ data: [], error: null });

		await loadPins(Array.from({ length: 150 }, (_, index) => `image-${index}`));

		expect(query.in).toHaveBeenCalledTimes(2);
		expect(query.in.mock.calls[0][1]).toHaveLength(100);
		expect(query.in.mock.calls[1][1]).toHaveLength(50);
	});

	it('says so when the pins cannot be loaded', async () => {
		query.range.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadPins(['image-1'])).resolves.toEqual({
			pins: [],
			error: m.pins.errors.network
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
			text: null
		});

		await createPin('image-1', { x: 0, y: 1, glossaryEntryId: null, text: ' A lily ' });
		expect(query.insert).toHaveBeenLastCalledWith({
			image_id: 'image-1',
			x: 0,
			y: 1,
			glossary_entry_id: null,
			text: 'A lily'
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
			error: { code: '23514', message: 'an image holds at most 10 pins' }
		});

		await expect(
			createPin('image-1', { x: 0.5, y: 0.5, glossaryEntryId: null, text: 'Lily' })
		).resolves.toEqual({ error: m.pins.errors.tooMany(10) });
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
			text: 'Lily'
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
		await expect(deletePin('pin-1')).resolves.toEqual({ error: m.pins.errors.network });
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
			error: m.pins.errors.network
		});
	});
});
