import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import ArtworkPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/42'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/artworks/artwork-preload/artwork-preload.ts', () => ({ preloadArtwork: vi.fn() }));
vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({ saveFlag: vi.fn() }));
vi.mock('#lib/backroom/flag-count/flag-count.svelte.ts', () => ({
	flagCount: { refresh: vi.fn(), forLearner: vi.fn(), value: 0 }
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;

const artwork: ArtworkRecord = {
	id: 'artwork-42',
	number: 42,
	images: [],
	favourite: false,
	title: 'Girl with a Pearl Earring',
	authors: ['Johannes Vermeer'],
	authorUnknown: false,
	yearFrom: null,
	fromBeforeCommonEra: false,
	yearTo: 1665,
	toBeforeCommonEra: false,
	yearApproximate: false,
	typeCode: 'painting',
	eraCode: 'early_modern',
	period: null,
	styles: [],
	materials: [],
	location: null,
	notes: '',
	image: { kind: 'url', url: IMAGE, width: 40, height: 50, id: 'image-1' }
} as ArtworkRecord;

function renderPage(): void {
	render(ArtworkPage, {
		data: { session: testSession(), artwork, pins: [] },
		params: { number: '42' }
	});
}

describe('artwork page flag', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		sessionStorage.clear();
		await page.viewport(1280, 800);
	});

	it('flags the image on the stage and says it went to Zaplecze', async () => {
		vi.mocked(saveFlag).mockResolvedValue({ created: true });
		renderPage();

		await page.getByRole('button', { name: m.backroom.flag }).click();
		await page.getByRole('radio', { name: m.backroom.reasons.image }).click();
		await page.getByRole('button', { name: m.backroom.confirm, exact: true }).click();

		await expect.element(page.getByText(m.backroom.flagged)).toBeInTheDocument();
		expect(saveFlag).toHaveBeenCalledWith({
			item: {
				kind: 'artwork',
				id: 'artwork-42',
				title: 'Girl with a Pearl Earring',
				imageId: 'image-1'
			},
			reason: 'image',
			comment: ''
		});
	});

	it('flags from the more actions on a phone', async () => {
		await page.viewport(390, 844);
		renderPage();

		await page.getByRole('button', { name: m.common.moreActions }).click();
		await page.getByRole('button', { name: m.backroom.flag }).click();

		await expect.element(page.getByRole('dialog', { name: m.backroom.dialogTitle })).toBeVisible();
		await page.viewport(1280, 800);
	});
});
