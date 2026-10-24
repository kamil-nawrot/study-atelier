import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { loadPlaceStarter } from './place-starter-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

const museums = { select: vi.fn() };
const places = { select: vi.fn(), not: vi.fn() };

describe('loadPlaceStarter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockImplementation(((table: string) =>
			table === 'catalogue_museums' ? museums : places) as never);
		places.select.mockReturnValue(places);
	});

	it('reads the catalogue and the countries of the places the learner has', async () => {
		museums.select.mockResolvedValue({
			data: [
				{ name: 'Luwr', english_name: 'Louvre Museum', country_code: 'FR' },
				{ name: 'Rijksmuseum', english_name: null, country_code: 'NL' }
			],
			error: null
		});
		places.not.mockResolvedValue({
			data: [
				{ country_code: 'FR', category_values: { name: 'Louvre' } },
				{ country_code: null, category_values: { name: 'Cellar' } }
			],
			error: null
		});

		const starter = await loadPlaceStarter();

		expect(supabase.from).toHaveBeenCalledWith('catalogue_museums');
		expect(supabase.from).toHaveBeenCalledWith('location_details');
		expect(starter.museums).toEqual([
			{ name: 'Luwr', aliases: ['Louvre Museum'], note: 'Francja' },
			{ name: 'Rijksmuseum', aliases: [], note: 'Holandia' }
		]);
		expect(starter.notes).toEqual({ louvre: 'Francja' });
	});

	it('falls back to nothing when a read fails', async () => {
		museums.select.mockResolvedValue({ data: null, error: { message: 'failed' } });
		places.not.mockResolvedValue({ data: null, error: { message: 'failed' } });

		await expect(loadPlaceStarter()).resolves.toEqual(emptyPlaceStarter());
	});
});
