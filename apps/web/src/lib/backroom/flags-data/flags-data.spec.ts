import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { restoreFlag, saveFlag } from './flags-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const rpc = vi.mocked(supabase.rpc);
const from = vi.mocked(supabase.from);

function pinQuery(id: string | null): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'eq', 'gte', 'lte', 'limit']) query[name] = vi.fn(() => query);
	query.maybeSingle = vi.fn().mockResolvedValue({ data: id ? { id } : null, error: null });
	from.mockReturnValue(query as never);
	return query;
}

describe('saveFlag', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('says whether the flag is new', async () => {
		rpc.mockResolvedValueOnce({ data: true, error: null } as never);
		await expect(
			saveFlag({
				item: { kind: 'term', id: 'term-1', name: 'Vanitas' },
				reason: 'definition',
				comment: ''
			})
		).resolves.toEqual({ created: true });
		expect(rpc).toHaveBeenCalledWith('save_flag', {
			flag: { term_id: 'term-1', reason: 'definition', comment: null }
		});

		rpc.mockResolvedValueOnce({ data: false, error: null } as never);
		await expect(
			saveFlag({
				item: { kind: 'term', id: 'term-1', name: 'Vanitas' },
				reason: 'definition',
				comment: ''
			})
		).resolves.toEqual({ created: false });
	});

	it('finds the pin of a review question by its place before saving', async () => {
		const query = pinQuery('pin-7');
		rpc.mockResolvedValueOnce({ data: true, error: null } as never);

		await saveFlag({
			item: {
				kind: 'artwork',
				id: 'artwork-1',
				title: 'Jerome',
				pin: { imageId: 'image-1', x: 0.25, y: 0.5 }
			},
			reason: 'pin',
			comment: ''
		});

		expect(from).toHaveBeenCalledWith('artwork_pins');
		expect(query.eq).toHaveBeenCalledWith('image_id', 'image-1');
		expect(rpc).toHaveBeenCalledWith('save_flag', {
			flag: {
				artwork_id: 'artwork-1',
				image_id: 'image-1',
				pin_id: 'pin-7',
				reason: 'pin',
				comment: null
			}
		});
	});

	it('keeps the image when the pin is no longer there', async () => {
		pinQuery(null);
		rpc.mockResolvedValueOnce({ data: true, error: null } as never);

		await saveFlag({
			item: {
				kind: 'artwork',
				id: 'artwork-1',
				title: 'Jerome',
				pin: { imageId: 'image-1', x: 0.25, y: 0.5 }
			},
			reason: 'pin',
			comment: ''
		});

		expect(rpc).toHaveBeenCalledWith('save_flag', {
			flag: { artwork_id: 'artwork-1', image_id: 'image-1', reason: 'pin', comment: null }
		});
	});

	it('does not look the pin up for another reason', async () => {
		rpc.mockResolvedValueOnce({ data: true, error: null } as never);

		await saveFlag({
			item: {
				kind: 'artwork',
				id: 'artwork-1',
				title: 'Jerome',
				pin: { imageId: 'image-1', x: 0.25, y: 0.5 }
			},
			reason: 'data',
			comment: ''
		});

		expect(from).not.toHaveBeenCalled();
	});

	it('says when the item is gone', async () => {
		rpc.mockResolvedValueOnce({ data: null, error: { code: '23503', message: 'fk' } } as never);

		await expect(
			saveFlag({
				item: { kind: 'symbol', id: 'symbol-1', name: 'Skull' },
				reason: 'meaning',
				comment: ''
			})
		).resolves.toEqual({ error: m.backroom.errors.gone });
	});
});

describe('restoreFlag', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('saves the flag again with its item, image, pin, comment, question and hold', async () => {
		rpc.mockResolvedValueOnce({ data: true, error: null } as never);
		const question = { mode: 'quiz_pin', text: 'Co to jest?' };

		await expect(
			restoreFlag({
				reason: 'pin',
				comment: 'Too far left',
				question,
				artworkId: 'a1',
				termId: null,
				symbolId: null,
				imageId: 'i1',
				pinId: 'p1',
				holds: true
			})
		).resolves.toEqual({});

		expect(rpc).toHaveBeenCalledWith('save_flag', {
			flag: {
				artwork_id: 'a1',
				image_id: 'i1',
				pin_id: 'p1',
				reason: 'pin',
				comment: 'Too far left',
				question,
				holds: true
			}
		});
	});

	it('says why a flag cannot come back', async () => {
		rpc.mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch' } } as never);

		await expect(
			restoreFlag({
				reason: 'data',
				comment: null,
				question: null,
				artworkId: 'a1',
				termId: null,
				symbolId: null,
				imageId: null,
				pinId: null,
				holds: false
			})
		).resolves.toEqual({ error: m.common.network });
	});
});
