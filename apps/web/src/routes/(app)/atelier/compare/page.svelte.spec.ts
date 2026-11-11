import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { goto } from '$app/navigation';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import ComparePage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/compare?left=1&right=2'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	loadAtelier: vi.fn(),
	resolveImages: vi.fn(),
	refreshExpiredImages: vi.fn()
}));

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"/>')}`;

function artwork(number: number, title: string): ArtworkRecord {
	return {
		id: `artwork-${number}`,
		number,
		images: [],
		favourite: false,
		title,
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
		image: { kind: 'url', url: IMAGE, width: 40, height: 50, id: `image-${number}` }
	};
}

function renderPage(data: Record<string, unknown>): void {
	render(ComparePage, {
		data: { session: testSession(), sides: { left: 1, right: 2 }, ...data },
		params: {}
	} as never);
}

describe('comparison page', () => {
	beforeEach(() => {
		vi.mocked(goto).mockReset();
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [] });
	});

	it('shows both artworks under the title of the comparison', async () => {
		renderPage({
			left: artwork(1, 'Girl with a Pearl Earring'),
			right: artwork(2, 'The Milkmaid')
		});

		await expect.element(page.getByText('Girl with a Pearl Earring')).toBeVisible();
		await expect.element(page.getByText('The Milkmaid')).toBeVisible();
		expect(document.title).toContain(m.compare.title);
	});

	it('swaps the halves from the top bar', async () => {
		renderPage({
			left: artwork(1, 'Girl with a Pearl Earring'),
			right: artwork(2, 'The Milkmaid')
		});

		await page.getByRole('banner').getByRole('button', { name: m.compare.swap }).click();

		expect(goto).toHaveBeenCalledWith('/atelier/compare?left=2&right=1', { replaceState: true });
	});

	it('offers no swap while a half is empty', async () => {
		renderPage({ sides: { left: 1, right: null }, left: artwork(1, 'Girl with a Pearl Earring') });

		await expect
			.element(page.getByRole('banner').getByRole('button', { name: m.compare.swap }))
			.not.toBeInTheDocument();
	});

	it('links back to the artwork the comparison started from', async () => {
		renderPage({ sides: { left: 1, right: null }, left: artwork(1, 'Girl with a Pearl Earring') });

		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.artworkView.back }))
			.toHaveAttribute('href', '/atelier/1');
	});

	it('leaves the half of a record number that is not in the atelier empty', async () => {
		renderPage({ sides: { left: 1, right: 99 }, left: artwork(1, 'Girl with a Pearl Earring') });

		await expect
			.element(
				page.getByRole('heading', { name: `${m.compare.questionLead} Girl with a Pearl Earring?` })
			)
			.toBeVisible();
	});

	it('shows a load failure in an alert', async () => {
		renderPage({ error: 'Network down' });

		await expect.element(page.getByText('Network down')).toBeVisible();
		await expect.element(page.getByText(m.compare.loadFailedTitle)).toBeVisible();
	});
});
