import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { savePalette } from './palette-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

function table(error: unknown): { update: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn> } {
	const eq = vi.fn().mockResolvedValue({ error });
	const update = vi.fn().mockReturnValue({ eq });
	vi.mocked(supabase.from).mockReturnValue({ update } as never);
	return { update, eq };
}

describe('savePalette', () => {
	beforeEach(() => vi.mocked(supabase.from).mockReset());

	it('stores the palette on the image', async () => {
		const { update, eq } = table(null);
		const palette = [{ color: '#aa8855', share: 1 }];

		expect(await savePalette('image-1', palette)).toBe(true);

		expect(supabase.from).toHaveBeenCalledWith('artwork_images');
		expect(update).toHaveBeenCalledWith({ palette });
		expect(eq).toHaveBeenCalledWith('id', 'image-1');
	});

	it('reports a failure', async () => {
		table({ message: 'denied' });

		expect(await savePalette('image-1', [{ color: '#aa8855', share: 1 }])).toBe(false);
	});
});
