import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadSymbolCover } from './symbol-cover-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));
vi.mock('#lib/images/own-image-data/own-image-data.ts', () => ({ ownImageUrls: vi.fn() }));

const query = {
	select: vi.fn(),
	eq: vi.fn(),
	not: vi.fn(),
	is: vi.fn(),
	order: vi.fn()
};

function answer(result: unknown): void {
	query.select.mockReturnValue(query);
	query.eq.mockReturnValue(query);
	query.not.mockReturnValue(query);
	query.is.mockReturnValue(query);
	query.order.mockReset().mockReturnValueOnce(query).mockResolvedValueOnce(result);
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
	own_image_path: 'owner/vanitas.jpg',
	own_image_url: null,
	image_width: 1200,
	image_height: 800,
	artworks: { deleted_at: null }
};

function row(
	id: string,
	meaning: string | null,
	createdAt: string,
	crop: string | null
): Record<string, unknown> {
	return {
		id,
		x: 0.5,
		y: 0.4,
		view_width: 0.2,
		crop_path: crop,
		symbol_meaning_id: meaning,
		created_at: createdAt,
		artwork_images: image
	};
}

describe('symbol cover data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(ownImageUrls).mockImplementation(
			async (paths) => new Map(paths.map((path) => [path, `https://images.test/${path}`]))
		);
	});

	it('reads the details with a loupe view of artworks outside the trash, newest first', async () => {
		answer({ data: [], error: null });

		await loadSymbolCover('skull');

		expect(supabase.from).toHaveBeenCalledWith('artwork_pins');
		expect(query.eq).toHaveBeenCalledWith('symbol_id', 'skull');
		expect(query.not).toHaveBeenCalledWith('view_width', 'is', null);
		expect(query.is).toHaveBeenCalledWith('artwork_images.artworks.deleted_at', null);
		expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
	});

	it('shows the crop of the main detail', async () => {
		answer({
			data: [
				row('pin-new', null, '2026-11-03T10:00:00Z', 'owner/new.jpg'),
				row('pin-main', 'death', '2026-11-01T10:00:00Z', 'owner/main.jpg')
			],
			error: null
		});

		const { lens } = await loadSymbolCover('skull', 'pin-main');

		expect(lens?.crop).toBe('https://images.test/owner/main.jpg');
	});

	it('shows the newest detail of the chosen meaning', async () => {
		answer({
			data: [
				row('pin-new', null, '2026-11-03T10:00:00Z', 'owner/new.jpg'),
				row('pin-death', 'death', '2026-11-02T10:00:00Z', 'owner/death.jpg'),
				row('pin-main', 'penance', '2026-11-01T10:00:00Z', 'owner/main.jpg')
			],
			error: null
		});

		const { lens } = await loadSymbolCover('skull', 'pin-main', 'death');

		expect(lens?.crop).toBe('https://images.test/owner/death.jpg');
	});

	it('has no lens for a symbol without details', async () => {
		answer({ data: [], error: null });

		await expect(loadSymbolCover('skull')).resolves.toEqual({});
	});

	it('says so when the details cannot be read', async () => {
		answer({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadSymbolCover('skull')).resolves.toEqual({
			error: m.common.network
		});
	});
});
