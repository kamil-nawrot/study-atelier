import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testSession } from '#lib/testing/auth.ts';
import TimelinePage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/timeline'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const ERA_KEY = 'study-atelier:timeline-era';

function renderTimeline(artworks: WallArtwork[] = [], error?: string): void {
	render(TimelinePage, { data: { session: testSession(), artworks, error }, params: {} });
}

function stage(): ReturnType<typeof page.getByRole> {
	return page.getByRole('slider', { name: m.timeline.stage });
}

describe('timeline page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		localStorage.clear();
		await page.viewport(1280, 800);
	});

	it('opens the era with the most dated artworks the first time', async () => {
		renderTimeline([
			testArtwork(1, 'Waza z Warki', { yearTo: -3000 }),
			testArtwork(2, 'Dyskobol', { yearTo: -450 }),
			testArtwork(3, 'Mona Lisa', { yearTo: 1519 })
		]);

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Starożytność');
		await expect.element(page.getByText('do 476')).toBeVisible();
	});

	it('opens the era looked at last on the device', async () => {
		localStorage.setItem(ERA_KEY, 'modern');
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Nowoczesność');
	});

	it('shows the whole era at the era step and the centuries it covers', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await expect.element(page.getByText('XV–XVIII w.')).toBeVisible();
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1640');
		await expect
			.element(page.getByRole('button', { name: 'Epoka', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByRole('button', { name: 'Tysiąclecie' })).not.toBeInTheDocument();
	});

	it('moves to a closer step and back with the buttons', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await page.getByRole('button', { name: m.timeline.zoomIn }).click();
		await expect
			.element(page.getByRole('button', { name: 'Stulecie', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText(/skala: stulecie/)).toBeVisible();

		await page.getByRole('button', { name: m.timeline.zoomOut }).click();
		await expect
			.element(page.getByRole('button', { name: 'Epoka', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('pans with the arrow keys and stops at the end of the era', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);
		await page.getByRole('button', { name: 'Stulecie', exact: true }).click();
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1640');

		stage().element().focus();
		for (let press = 0; press < 12; press++) {
			stage()
				.element()
				.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		}

		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1744');
	});

	it('opens the next era and remembers it', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await page.getByRole('button', { name: m.timeline.next('Nowoczesność') }).click();

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Nowoczesność');
		expect(localStorage.getItem(ERA_KEY)).toBe('modern');
	});

	it('opens an era from the era buttons and from the strip', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await page.getByRole('button', { name: 'Prehistoria', exact: true }).first().click();
		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Prehistoria');
		await expect.element(page.getByRole('button', { name: '10 tysiącleci' })).toBeVisible();

		const strip = page.getByRole('navigation', { name: m.timeline.strip });
		(strip.getByRole('button', { name: 'Współczesność' }).element() as HTMLButtonElement).click();
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Współczesność');
	});

	it('says when the collection could not be loaded', async () => {
		renderTimeline([], 'Brak połączenia.');

		await expect.element(page.getByText(m.timeline.loadErrorTitle)).toBeVisible();
		await expect.element(stage()).not.toBeInTheDocument();
	});
});
