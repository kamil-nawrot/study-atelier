import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testSession } from '#lib/testing/auth.ts';
import type { TimelineEvent } from '#lib/timeline/types.ts';
import { deleteTimelineEvent } from '#lib/timeline/timeline-data.ts';
import { invalidateAll } from '$app/navigation';
import TimelinePage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/timeline'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('#lib/timeline/timeline-data.ts', () => ({ deleteTimelineEvent: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const ERA_KEY = 'study-atelier:timeline-era';

function testEvent(
	id: string,
	name: string,
	yearFrom: number | null,
	yearTo: number,
	description = ''
): TimelineEvent {
	return { id, name, yearFrom, yearTo, yearApproximate: false, description };
}

function renderTimeline(
	artworks: WallArtwork[] = [],
	error?: string,
	events: TimelineEvent[] = []
): void {
	render(TimelinePage, { data: { session: testSession(), artworks, events, error }, params: {} });
}

async function press(locator: ReturnType<typeof page.getByRole>): Promise<void> {
	await expect.element(locator).toBeInTheDocument();
	(locator.element() as HTMLElement).click();
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

	it('shows a dot for every dated artwork of the era and none for the others', async () => {
		renderTimeline([
			testArtwork(1, 'Mona Lisa', { yearFrom: 1503, yearTo: 1519, date: '1503–1519' }),
			testArtwork(2, 'Straż nocna', { yearTo: 1642, date: '1642' }),
			testArtwork(3, 'Bez daty', { yearTo: null, date: undefined }),
			testArtwork(4, 'Gwiaździsta noc', { yearTo: 1889, date: '1889' })
		]);

		await expect
			.element(page.getByRole('button', { name: 'Mona Lisa, 1503–1519' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Straż nocna, 1642' }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Bez daty/ })).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /Gwiaździsta noc/ }))
			.not.toBeInTheDocument();
	});

	it('opens the card of a chosen artwork with a link to its page and a preview', async () => {
		renderTimeline([
			testArtwork(7, 'Straż nocna', {
				yearTo: 1642,
				date: '1642',
				eraCode: 'early_modern',
				styles: ['barok']
			})
		]);

		const dot = page.getByRole('button', { name: 'Straż nocna, 1642' });
		(dot.element() as HTMLButtonElement).click();

		await expect.element(dot).toHaveAttribute('aria-pressed', 'true');
		const card = page.getByRole('region', { name: m.timeline.card.artwork });
		await expect
			.element(card.getByRole('link', { name: 'Straż nocna' }))
			.toHaveAttribute('href', '/atelier/7');
		await expect.element(card.getByText('nowożytność · barok')).toBeVisible();
		expect(document.querySelector('.preview')).not.toBeNull();
	});

	it('marks an artwork that starts in the previous era', async () => {
		renderTimeline([
			testArtwork(1, 'Ogród rozkoszy', { yearFrom: 1490, yearTo: 1510, date: '1490–1510' })
		]);

		await expect
			.element(page.getByRole('button', { name: 'Ogród rozkoszy, ‹ 1490–1510' }))
			.toBeInTheDocument();
	});

	it('says when there are no events yet', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await expect.element(page.getByText(m.timeline.noEvents)).toBeVisible();
	});

	it('shows the events of the era and names those at the reading line', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })], undefined, [
			testEvent('thirty', 'Wojna trzydziestoletnia', 1618, 1648),
			testEvent('america', 'Odkrycie Ameryki', null, 1492),
			testEvent('napoleon', 'Wojny napoleońskie', 1803, 1815)
		]);

		await expect
			.element(page.getByRole('button', { name: 'Wojna trzydziestoletnia, 1618–1648' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Odkrycie Ameryki, 1492' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /Wojny napoleońskie/ }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByText(m.timeline.now('1640', 'Wojna trzydziestoletnia')))
			.toBeVisible();
	});

	it('opens the card of a chosen period with its artworks and its length', async () => {
		renderTimeline(
			[
				testArtwork(1, 'Straż nocna', { yearTo: 1642, date: '1642' }),
				testArtwork(2, 'Mona Lisa', { yearTo: 1519, date: '1519' })
			],
			undefined,
			[testEvent('thirty', 'Wojna trzydziestoletnia', 1618, 1648, 'Wojna w Europie.')]
		);

		await press(page.getByRole('button', { name: 'Wojna trzydziestoletnia, 1618–1648' }));

		const card = page.getByRole('region', { name: m.timeline.card.period });
		await expect
			.element(card.getByRole('heading', { name: 'Wojna trzydziestoletnia' }))
			.toBeVisible();
		await expect.element(card.getByText(/30 lat/)).toBeVisible();
		await expect.element(card.getByText('Wojna w Europie.')).toBeVisible();
		await expect.element(card.getByRole('button', { name: 'Straż nocna' })).toBeVisible();
		await expect.element(card.getByRole('button', { name: 'Mona Lisa' })).not.toBeInTheDocument();
		await expect
			.element(card.getByRole('link', { name: m.timeline.card.edit }))
			.toHaveAttribute('href', '/atelier/timeline/events/thirty/edit');

		await card.getByRole('button', { name: m.timeline.card.showWhole }).click();
		await expect
			.element(page.getByRole('button', { name: 'Stulecie', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');

		await card.getByRole('button', { name: 'Straż nocna' }).click();
		const artworkCard = page.getByRole('region', { name: m.timeline.card.artwork });
		await expect
			.element(artworkCard.getByRole('button', { name: 'Wojna trzydziestoletnia' }))
			.toBeVisible();
	});

	it('deletes an event after asking and confirms it', async () => {
		vi.mocked(deleteTimelineEvent).mockResolvedValue({});
		renderTimeline([], undefined, [testEvent('treaty', 'Pokój westfalski', null, 1648)]);

		await press(page.getByRole('button', { name: 'Pokój westfalski, 1648' }));
		await press(
			page
				.getByRole('region', { name: m.timeline.card.event })
				.getByRole('button', { name: m.timeline.card.delete })
		);
		const dialog = page.getByRole('alertdialog');
		await expect
			.element(dialog.getByText(m.timeline.deleteConfirm.title('Pokój westfalski')))
			.toBeVisible();
		await expect.element(dialog.getByText(m.timeline.deleteConfirm.description)).toBeVisible();
		await press(dialog.getByRole('button', { name: m.timeline.deleteConfirm.confirm }));

		await vi.waitFor(() => expect(deleteTimelineEvent).toHaveBeenCalledWith('treaty'));
		await vi.waitFor(() => expect(invalidateAll).toHaveBeenCalled());
		await expect.element(page.getByText(m.timeline.deleted('Pokój westfalski'))).toBeVisible();
	});

	it('keeps the dialog open with the error when deleting fails', async () => {
		vi.mocked(deleteTimelineEvent).mockResolvedValue({ error: m.common.unexpectedError });
		renderTimeline([], undefined, [testEvent('treaty', 'Pokój westfalski', null, 1648)]);

		await press(page.getByRole('button', { name: 'Pokój westfalski, 1648' }));
		await press(
			page
				.getByRole('region', { name: m.timeline.card.event })
				.getByRole('button', { name: m.timeline.card.delete })
		);
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await press(
			page.getByRole('alertdialog').getByRole('button', { name: m.timeline.deleteConfirm.confirm })
		);

		await expect
			.element(page.getByRole('alertdialog').getByText(m.common.unexpectedError))
			.toBeVisible();
		expect(invalidateAll).not.toHaveBeenCalled();
	});

	it('offers to add an event in the top bar', async () => {
		renderTimeline();

		await expect
			.element(page.getByRole('link', { name: m.timeline.add }))
			.toHaveAttribute('href', '/atelier/timeline/events/new');
	});

	it('returns to a saved event in its era and confirms it', async () => {
		navigation.state = {
			timelineEvent: {
				message: m.timeline.saved('Wojny napoleońskie'),
				yearFrom: 1803,
				yearTo: 1815
			}
		};
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Nowoczesność');
		await expect.element(page.getByText(m.timeline.saved('Wojny napoleońskie'))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: 'Pokolenie', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(localStorage.getItem(ERA_KEY)).toBe('modern');
		navigation.state = {};
	});

	it('says when the collection could not be loaded', async () => {
		renderTimeline([], 'Brak połączenia.');

		await expect.element(page.getByText(m.timeline.loadErrorTitle)).toBeVisible();
		await expect.element(stage()).not.toBeInTheDocument();
	});
});
