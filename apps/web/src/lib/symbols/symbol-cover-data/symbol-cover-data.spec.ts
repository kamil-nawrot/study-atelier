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
	order: vi.fn(),
	limit: vi.fn()
};

function answer(...results: unknown[]): void {
	for (const step of [query.select, query.eq, query.not, query.is, query.order]) {
		step.mockReset().mockReturnValue(query);
	}
	query.limit.mockReset();
	for (const result of results) query.limit.mockResolvedValueOnce(result);
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

function row(id: string, crop: string | null): Record<string, unknown> {
	return { id, x: 0.5, y: 0.4, view_width: 0.2, crop_path: crop, artwork_images: image };
}

describe('symbol cover data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(ownImageUrls).mockImplementation(
			async (paths) => new Map(paths.map((path) => [path, `https://images.test/${path}`]))
		);
	});

	it('reads the newest detail with a loupe view of an artwork outside the trash', async () => {
		answer({ data: [row('pin-new', 'owner/new.jpg')], error: null });

		const { lens } = await loadSymbolCover('skull');

		expect(supabase.from).toHaveBeenCalledWith('artwork_pins');
		expect(query.eq).toHaveBeenCalledWith('symbol_id', 'skull');
		expect(query.not).toHaveBeenCalledWith('view_width', 'is', null);
		expect(query.is).toHaveBeenCalledWith('artwork_images.artworks.deleted_at', null);
		expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
		expect(query.limit).toHaveBeenCalledWith(1);
		expect(lens?.crop).toBe('https://images.test/owner/new.jpg');
	});

	it('shows the crop of the main detail with one request', async () => {
		answer({ data: [row('pin-main', 'owner/main.jpg')], error: null });

		const { lens } = await loadSymbolCover('skull', 'pin-main');

		expect(query.eq).toHaveBeenCalledWith('id', 'pin-main');
		expect(query.limit).toHaveBeenCalledTimes(1);
		expect(lens?.crop).toBe('https://images.test/owner/main.jpg');
	});

	it('shows the newest detail of the chosen meaning when the main detail has another', async () => {
		answer({ data: [], error: null }, { data: [row('pin-death', 'owner/death.jpg')], error: null });

		const { lens } = await loadSymbolCover('skull', 'pin-main', 'death');

		expect(query.eq).toHaveBeenCalledWith('symbol_meaning_id', 'death');
		expect(query.limit).toHaveBeenCalledTimes(2);
		expect(lens?.crop).toBe('https://images.test/owner/death.jpg');
	});

	it('has no lens for a symbol without details', async () => {
		answer({ data: [], error: null });

		await expect(loadSymbolCover('skull')).resolves.toEqual({});
	});

	it('says so when the details cannot be read', async () => {
		answer({ data: null, error: { message: 'Failed to fetch' } });

		await expect(loadSymbolCover('skull', 'pin-main')).resolves.toEqual({
			error: m.common.network
		});
	});
});
