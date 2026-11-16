import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import BackroomPage from './+page.svelte';
import { load } from './+page.ts';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/backroom'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	loadFlags: vi.fn(),
	countFlags: vi.fn().mockResolvedValue(0),
	deleteFlag: vi.fn()
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', async (original) => ({
	...(await original<typeof import('#lib/wall/wall-data/wall-data.ts')>()),
	loadAtelier: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', async (original) => ({
	...(await original<typeof import('#lib/glossary/glossary-data/glossary-data.ts')>()),
	loadTermIndex: vi.fn()
}));

const undated = testArtwork(3, 'Undated', { styles: ['Gothic'], yearTo: null });
const term = {
	id: 'term-1',
	name: 'Tympanum',
	category: 'architecture' as const,
	synonyms: [],
	forms: [],
	hasDefinition: false
};

describe('Zaplecze page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		navigation.state = {};
	});

	it('loads the flags with the collection and the terms and names a failure', async () => {
		vi.mocked(loadFlags).mockResolvedValue({ flags: [] });
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [undated] });
		vi.mocked(loadTermIndex).mockResolvedValue({ terms: [term], error: m.common.network });

		const data = await load({} as never);

		expect(data).toEqual({
			flags: [],
			artworks: [undated],
			terms: [{ id: 'term-1', name: 'Tympanum', hasDefinition: false }],
			error: m.common.network
		});
	});

	it('shows Zaplecze with the message of a finished queue', async () => {
		navigation.state = { backroomMessage: m.backroom.done(3) };
		render(BackroomPage, {
			data: {
				session: testSession(),
				flags: [],
				artworks: [undated],
				terms: [{ id: 'term-1', name: 'Tympanum', hasDefinition: false }]
			}
		} as never);

		await expect.element(page.getByRole('heading', { name: m.backroom.title })).toBeVisible();
		await expect.element(page.getByText(m.backroom.emptyFlagsTitle)).toBeVisible();
		await expect.element(page.getByText(m.backroom.done(3))).toBeInTheDocument();
	});
});
