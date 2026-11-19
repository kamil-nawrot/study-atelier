import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
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

const summaries = {
	eras: { early_modern: { summary: 'From the discovery of America to the Revolution.' } },
	values: { 'author:Johannes Vermeer': { id: 'author-3', summary: 'Painter of quiet rooms.' } },
	countries: {}
};

function renderPage(): void {
	render(ArtworkPage, {
		data: { session: testSession(), artwork, pins: [], summaries },
		params: { number: '42' }
	});
}

describe('artwork page value links', () => {
	it('links the card of a value to its page in Kartoteka', async () => {
		renderPage();

		await page.getByRole('button', { name: 'Johannes Vermeer' }).click();

		await expect
			.element(page.getByRole('link', { name: m.cardIndex.openInCardIndex }))
			.toHaveAttribute('href', '/atelier/values/author/author-3');
	});

	it('links the card of the era to the page of the era', async () => {
		renderPage();

		await page.getByRole('button', { name: m.eras.early_modern.name, exact: true }).click();

		await expect
			.element(page.getByRole('link', { name: m.cardIndex.openInCardIndex }))
			.toHaveAttribute('href', '/atelier/values/era/early_modern');
	});
});
