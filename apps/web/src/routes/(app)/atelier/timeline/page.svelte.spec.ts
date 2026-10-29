import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '@study-atelier/ui/styles.css';
import { render } from 'vitest-browser-svelte';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import { deleteTimelineEvent } from '#lib/timeline/timeline-data/timeline-data.ts';
import { invalidateAll } from '$app/navigation';
import TimelinePage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/timeline'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('#lib/timeline/timeline-data/timeline-data.ts', () => ({ deleteTimelineEvent: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const ERA_KEY = 'study-atelier:timeline-era';

function testEvent(
	id: string,
	name: string,
	yearFrom: number | null,
	yearTo: number,
	description = ''
): TimelineEvent {
	return { id, name, yearFrom, yearTo, yearApproximate: false, description, source: null };
}

function renderTimeline(
	artworks: WallArtwork[] = [],
	error?: string,
	events: TimelineEvent[] = []
): void {
	render(TimelinePage, {
		data: { session: testSession(), artworks, events, error, empty: false },
		params: {}
	});
}

async function press(locator: ReturnType<typeof page.getByRole>): Promise<void> {
	await expect.element(locator).toBeInTheDocument();
	(locator.element() as HTMLElement).click();
}

async function expectEra(name: string): Promise<void> {
	await expect
		.poll(() =>
			document
				.querySelector(`nav[aria-label="${m.timeline.strip}"] [aria-current="true"]`)
				?.getAttribute('aria-label')
		)
		.toBe(name);
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

	it('shows the name of the module and its lead', async () => {
		renderTimeline();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.timeline.title);
		await expect.element(page.getByText(m.timeline.lead)).toBeVisible();
	});

	it('opens the era with the most dated artworks the first time', async () => {
		renderTimeline([
			testArtwork(1, 'Waza z Warki', { yearTo: -3000 }),
			testArtwork(2, 'Dyskobol', { yearTo: -450 }),
			testArtwork(3, 'Mona Lisa', { yearTo: 1519 })
		]);

		await expectEra('Starożytność');
	});

	it('opens the era looked at last on the device', async () => {
		localStorage.setItem(ERA_KEY, 'modern');
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await expectEra('Nowoczesność');
	});

	it('shows the whole era at the era step and the centuries it covers', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

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

		await expectEra('Nowoczesność');
		expect(localStorage.getItem(ERA_KEY)).toBe('modern');
	});

	it('opens an era from the strip', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await press(
			page
				.getByRole('navigation', { name: m.timeline.strip })
				.getByRole('button', { name: 'Prehistoria' })
		);
		await expectEra('Prehistoria');
		await expect.element(page.getByRole('button', { name: '10 tysiącleci' })).toBeVisible();

		const strip = page.getByRole('navigation', { name: m.timeline.strip });
		(strip.getByRole('button', { name: 'Współczesność' }).element() as HTMLButtonElement).click();
		await expectEra('Współczesność');
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

	it('selects an artwork with a tap and unselects it, but ignores a mouse click', async () => {
		renderTimeline([
			testArtwork(7, 'Straż nocna', {
				yearTo: 1642,
				date: '1642',
				eraCode: 'early_modern',
				styles: ['barok']
			})
		]);

		const dot = page.getByRole('button', { name: 'Straż nocna, 1642' });
		const button = dot.element() as HTMLButtonElement;
		button.click();
		await expect.element(dot).toHaveAttribute('aria-pressed', 'true');

		button.click();
		await expect.element(dot).toHaveAttribute('aria-pressed', 'false');

		button.dispatchEvent(new PointerEvent('click', { pointerType: 'mouse', bubbles: true }));
		await expect.element(dot).toHaveAttribute('aria-pressed', 'false');
		expect(document.querySelector('a[href="/atelier/7"]')).toBeNull();

		button.click();
		await expect.element(dot).toHaveAttribute('aria-pressed', 'true');
	});

	it('takes the next tap after a drag the system cancelled', async () => {
		renderTimeline([testArtwork(7, 'Straż nocna', { yearTo: 1642, date: '1642' })]);
		const dot = page.getByRole('button', { name: 'Straż nocna, 1642' });
		await expect.element(dot).toBeInTheDocument();
		const surface = stage().element() as HTMLElement;
		const box = surface.getBoundingClientRect();
		const at = { clientX: box.left + 100, clientY: box.top + 100, pointerId: 3, bubbles: true };

		surface.dispatchEvent(new PointerEvent('pointerdown', at));
		surface.dispatchEvent(new PointerEvent('pointermove', { ...at, clientX: at.clientX + 60 }));
		surface.dispatchEvent(new PointerEvent('pointercancel', at));
		(dot.element() as HTMLButtonElement).click();

		await expect.element(dot).toHaveAttribute('aria-pressed', 'true');
	});

	it('closes a pinned preview with a click on the empty stage or with Escape', async () => {
		renderTimeline([testArtwork(7, 'Straż nocna', { yearTo: 1642, date: '1642' })]);
		const dot = page.getByRole('button', { name: 'Straż nocna, 1642' });

		(dot.element() as HTMLButtonElement).click();
		await expect.element(dot).toHaveAttribute('aria-pressed', 'true');
		(stage().element() as HTMLElement).click();
		await expect.element(dot).toHaveAttribute('aria-pressed', 'false');

		(dot.element() as HTMLButtonElement).click();
		await expect.element(dot).toHaveAttribute('aria-pressed', 'true');
		stage()
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await expect.element(dot).toHaveAttribute('aria-pressed', 'false');
	});

	it('marks an artwork that starts in the previous era', async () => {
		renderTimeline([
			testArtwork(1, 'Ogród rozkoszy', { yearFrom: 1490, yearTo: 1510, date: '1490–1510' })
		]);

		await expect
			.element(page.getByRole('button', { name: 'Ogród rozkoszy, ‹ 1490–1510' }))
			.toBeInTheDocument();
	});

	it('shows an empty Kalendarium instead of the timeline when nothing has a year', async () => {
		render(TimelinePage, {
			data: { session: testSession(), artworks: [], events: [], error: undefined, empty: true },
			params: {}
		});

		await expect.element(page.getByText(m.timeline.emptyTitle)).toBeVisible();
		await expect.element(stage()).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.atelier.filters.button }))
			.not.toBeInTheDocument();
	});

	it('says when there are no events yet', async () => {
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await expect.element(page.getByText(m.timeline.noEvents)).toBeVisible();
	});

	it('shows the events of the era and names those at the reading line only for a screen reader', async () => {
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
		const spoken = m.timeline.now('1640', [m.timeline.nowEvents('Wojna trzydziestoletnia')]);
		await vi.waitFor(() =>
			expect(document.querySelector('[aria-live="polite"].visually-hidden')?.textContent).toBe(
				spoken
			)
		);
		expect(
			[...document.querySelectorAll('p')].filter(
				(paragraph) =>
					paragraph.textContent === spoken && !paragraph.classList.contains('visually-hidden')
			)
		).toHaveLength(0);
	});

	it('cuts a long event name to 200 px and shows it whole in a tooltip', async () => {
		const long = 'Pokój westfalski kończący wojnę trzydziestoletnią w Rzeszy';
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })], undefined, [
			testEvent('treaty', long, null, 1648),
			testEvent('america', 'Odkrycie Ameryki', null, 1492)
		]);

		const treaty = page.getByRole('button', { name: `${long}, 1648` });
		await expect.element(treaty).toBeInTheDocument();
		const name = treaty.element().querySelector('.name') as HTMLElement;
		expect(name.getBoundingClientRect().width).toBeLessThanOrEqual(200);
		expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
		expect(treaty.element().querySelector('[role="tooltip"]')?.textContent).toBe(long);
		expect(
			page
				.getByRole('button', { name: 'Odkrycie Ameryki, 1492' })
				.element()
				.querySelector('[role="tooltip"]')
		).toBeNull();
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
			.element(card.getByRole('link', { name: m.common.edit }))
			.toHaveAttribute('href', '/atelier/timeline/events/thirty/edit');

		await card.getByRole('button', { name: m.timeline.card.showWhole }).click();
		await expect
			.element(page.getByRole('button', { name: 'Stulecie', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');

		await card.getByRole('button', { name: 'Straż nocna' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Straż nocna, 1642' }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('opens the era of an artwork chosen from an event that crosses two eras', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline(
			[testArtwork(3, 'Tratwa Meduzy', { yearFrom: 1818, yearTo: 1819, date: '1818–1819' })],
			undefined,
			[testEvent('industry', 'Rewolucja przemysłowa', 1760, 1840)]
		);

		await press(page.getByRole('button', { name: 'Rewolucja przemysłowa ›, 1760–1840' }));
		await press(
			page
				.getByRole('region', { name: m.timeline.card.period })
				.getByRole('button', { name: 'Tratwa Meduzy' })
		);

		await expectEra('Nowoczesność');
		await expect
			.element(page.getByRole('button', { name: 'Tratwa Meduzy, 1818–1819' }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('shows the Wikipedia source of an event in its card', async () => {
		renderTimeline([], undefined, [
			{
				...testEvent('war', 'Wojna trzydziestoletnia', 1618, 1648, 'Konflikt w Europie.'),
				source: {
					title: 'Wojna trzydziestoletnia',
					url: 'https://pl.wikipedia.org/wiki/Wojna_trzydziestoletnia',
					licence: 'CC BY-SA 4.0',
					fetchedOn: '2026-10-21'
				}
			}
		]);

		await press(page.getByRole('button', { name: 'Wojna trzydziestoletnia, 1618–1648' }));
		const card = page.getByRole('region', { name: m.timeline.card.period });
		await expect
			.element(card.getByRole('link', { name: '„Wojna trzydziestoletnia”' }))
			.toHaveAttribute('href', 'https://pl.wikipedia.org/wiki/Wojna_trzydziestoletnia');
		await expect.element(card.getByRole('link', { name: 'CC BY-SA 4.0' })).toBeVisible();
	});

	it('deletes an event after asking and confirms it', async () => {
		vi.mocked(deleteTimelineEvent).mockResolvedValue({});
		renderTimeline([], undefined, [testEvent('treaty', 'Pokój westfalski', null, 1648)]);

		await press(page.getByRole('button', { name: 'Pokój westfalski, 1648' }));
		await press(
			page
				.getByRole('region', { name: m.timeline.card.event })
				.getByRole('button', { name: m.common.delete })
		);
		const dialog = page.getByRole('alertdialog');
		await expect
			.element(dialog.getByText(m.timeline.deleteConfirm.title('Pokój westfalski')))
			.toBeVisible();
		await expect.element(dialog.getByText(m.timeline.deleteConfirm.description)).toBeVisible();
		await press(dialog.getByRole('button', { name: m.common.delete }));

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
				.getByRole('button', { name: m.common.delete })
		);
		await expect.element(page.getByRole('alertdialog')).toBeVisible();
		await press(page.getByRole('alertdialog').getByRole('button', { name: m.common.delete }));

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

		await expectEra('Nowoczesność');
		await expect.element(page.getByText(m.timeline.saved('Wojny napoleońskie'))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: 'Pokolenie', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(localStorage.getItem(ERA_KEY)).toBe('modern');
		navigation.state = {};
	});

	it('says above the stage on a phone that there are no events yet', async () => {
		await page.viewport(390, 844);
		renderTimeline([testArtwork(1, 'Mona Lisa', { yearTo: 1519 })]);

		await expect.element(stage()).toHaveAttribute('aria-orientation', 'vertical');
		await expect.element(page.getByText(m.timeline.noEvents)).toBeVisible();
		expect(stage().element().textContent).not.toContain(m.timeline.noEvents);
	});

	it('runs time from top to bottom on a phone', async () => {
		await page.viewport(390, 844);
		renderTimeline([testArtwork(1, 'Straż nocna', { yearTo: 1642, date: '1642' })], undefined, [
			testEvent('thirty', 'Wojna trzydziestoletnia', 1618, 1648)
		]);

		await expect.element(stage()).toHaveAttribute('aria-orientation', 'vertical');
		await expect
			.element(page.getByRole('button', { name: 'Wojna trzydziestoletnia, 1618–1648' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Straż nocna, 1642' }))
			.toBeInTheDocument();

		await page.getByRole('button', { name: 'Stulecie', exact: true }).click();
		await expect
			.element(page.getByRole('button', { name: 'Stulecie', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1640');
		stage().element().focus();
		stage()
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1665');
	});

	it('runs time from left to right on a larger screen', async () => {
		renderTimeline();

		await expect.element(stage()).toHaveAttribute('aria-orientation', 'horizontal');
	});

	it('says when the collection could not be loaded', async () => {
		renderTimeline([], 'Brak połączenia.');

		await expect.element(page.getByText(m.timeline.loadErrorTitle)).toBeVisible();
		await expect.element(stage()).not.toBeInTheDocument();
	});

	it('shows the name of the current era above the scale', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline();

		await expect.element(page.getByText('Nowożytność', { exact: true })).toBeVisible();
	});

	it('gives every chosen period and style its own lane, and clears them in another era', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([
			testArtwork(1, 'Straż nocna', {
				yearTo: 1642,
				date: '1642',
				period: 'Barok',
				styles: ['Tenebryzm'],
				favourite: true
			}),
			testArtwork(2, 'Ekstaza św. Teresy', { yearTo: 1652, date: '1652', period: 'Barok' }),
			testArtwork(3, 'Narodziny Wenus', { yearTo: 1485, date: '1485', period: 'Renesans' })
		]);

		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		const panel = page.getByRole('complementary', { name: m.atelier.filters.title });
		await expect
			.element(panel.getByText(m.timeline.filters.lanesHint('nowożytność')))
			.toBeVisible();
		await press(panel.getByRole('button', { name: /Barok/ }));
		await press(panel.getByRole('button', { name: /Tenebryzm/ }));

		await expect.element(page.getByText(m.timeline.lane('Barok', 2))).toBeInTheDocument();
		await expect.element(page.getByText(m.timeline.lane('Tenebryzm', 1))).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Narodziny Wenus, 1485' }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('list', { name: m.atelier.filters.activeLabel }))
			.toHaveTextContent(/Barok.*Tenebryzm/);

		await press(page.getByRole('button', { name: m.timeline.next('Nowoczesność') }));
		await expect.element(page.getByText(m.timeline.lane('Barok', 0))).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('list', { name: m.atelier.filters.activeLabel }))
			.not.toBeInTheDocument();
	});

	it('says so when no artwork of the era matches the filters', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([testArtwork(1, 'Straż nocna', { yearTo: 1642, date: '1642' })]);

		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		await press(
			page
				.getByRole('complementary', { name: m.atelier.filters.title })
				.getByRole('button', { name: /Ulubione/ })
		);

		await expect.element(page.getByText(m.timeline.filters.empty)).toBeInTheDocument();
	});

	it('hides the events and names the artworks at the reading line with the switches', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline(
			[testArtwork(1, 'Straż nocna', { yearFrom: 1600, yearTo: 1700, date: '1600–1700' })],
			undefined,
			[testEvent('war', 'Wojna trzydziestoletnia', 1618, 1648)]
		);

		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		const panel = page.getByRole('complementary', { name: m.atelier.filters.title });
		await press(panel.getByRole('switch', { name: m.timeline.filters.readingArtworks }));
		await press(page.getByRole('button', { name: 'Stulecie', exact: true }));
		await expect.element(page.getByText(m.timeline.readingArtworks)).toBeVisible();
		const title = page.getByRole('button', { name: 'Straż nocna', exact: true });
		await expect.element(title).toBeVisible();
		await title.click();
		await expect
			.element(page.getByRole('button', { name: 'Straż nocna, 1600–1700' }))
			.toHaveAttribute('aria-pressed', 'true');

		await press(panel.getByRole('switch', { name: m.timeline.filters.events }));
		await expect
			.element(page.getByRole('button', { name: /Wojna trzydziestoletnia/ }))
			.not.toBeInTheDocument();
		await expect.element(page.getByText(/w tym czasie/)).not.toBeInTheDocument();
	});

	it('names the year and speaks the artworks at the reading line when no event is there', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([
			testArtwork(1, 'Straż nocna', { yearFrom: 1600, yearTo: 1700, date: '1600–1700' })
		]);
		const live = (): string =>
			document.querySelector('[aria-live="polite"].visually-hidden')?.textContent ?? '';

		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		await press(
			page
				.getByRole('complementary', { name: m.atelier.filters.title })
				.getByRole('switch', { name: m.timeline.filters.readingArtworks })
		);
		await press(page.getByRole('button', { name: 'Stulecie', exact: true }));

		await expect
			.element(page.getByRole('button', { name: 'Straż nocna', exact: true }))
			.toBeVisible();
		await vi.waitFor(() =>
			expect(live()).toBe(m.timeline.now('1640', [m.timeline.nowArtworks('Straż nocna', -2)]))
		);
	});

	it('lists a work that spans the reading line first and counts the rest', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([
			testArtwork(1, 'Straż nocna', { yearTo: 1642, date: '1642' }),
			testArtwork(2, 'Las Meninas', { yearTo: 1638, date: '1638' }),
			testArtwork(3, 'Ekstaza św. Teresy', { yearTo: 1641, date: '1641' }),
			testArtwork(4, 'Pejzaż', { yearTo: 1639, date: '1639' }),
			testArtwork(5, 'Kościół', { yearFrom: 1600, yearTo: 1700, date: '1600–1700' })
		]);
		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		await press(
			page
				.getByRole('complementary', { name: m.atelier.filters.title })
				.getByRole('switch', { name: m.timeline.filters.readingArtworks })
		);
		await press(page.getByRole('button', { name: 'Stulecie', exact: true }));
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1640');

		const row = page.getByRole('list').filter({ hasText: 'Kościół' });
		await expect.element(row).toBeVisible();
		const titles = Array.from(row.element().querySelectorAll('cite'), (cite) => cite.textContent);
		expect(titles).toHaveLength(3);
		expect(titles[0]).toBe('Kościół');
		await expect.element(page.getByText(m.timeline.readingMore(2), { exact: true })).toBeVisible();
	});

	it('leaves room around the artworks at the reading line for the focus outline', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([
			testArtwork(1, 'Straż nocna', { yearFrom: 1600, yearTo: 1700, date: '1600–1700' })
		]);
		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		await press(
			page
				.getByRole('complementary', { name: m.atelier.filters.title })
				.getByRole('switch', { name: m.timeline.filters.readingArtworks })
		);
		await press(page.getByRole('button', { name: 'Stulecie', exact: true }));
		const title = page.getByRole('button', { name: 'Straż nocna', exact: true });
		await expect.element(title).toBeVisible();

		const row = document.querySelector('.reading-artworks') as HTMLElement;
		const outline = title.element().getBoundingClientRect();
		const box = row.getBoundingClientRect();
		const reach =
			2 *
				parseFloat(
					getComputedStyle(document.documentElement).getPropertyValue('--border-width-base')
				) +
			parseFloat(
				getComputedStyle(document.documentElement).getPropertyValue('--border-width-hairline')
			);
		expect(outline.top - reach).toBeGreaterThanOrEqual(box.top);
		expect(outline.bottom + reach).toBeLessThanOrEqual(box.bottom);
		expect(outline.left - reach).toBeGreaterThanOrEqual(box.left);
	});

	it('forgets a chosen event when the events are hidden', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([], undefined, [testEvent('war', 'Wojna trzydziestoletnia', 1618, 1648)]);

		await press(page.getByRole('button', { name: 'Wojna trzydziestoletnia, 1618–1648' }));
		await expect.element(page.getByRole('region', { name: m.timeline.card.period })).toBeVisible();
		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		const panel = page.getByRole('complementary', { name: m.atelier.filters.title });
		await press(panel.getByRole('switch', { name: m.timeline.filters.events }));
		await press(panel.getByRole('switch', { name: m.timeline.filters.events }));

		await expect
			.element(page.getByRole('button', { name: 'Wojna trzydziestoletnia, 1618–1648' }))
			.toHaveAttribute('aria-pressed', 'false');
		await expect
			.element(page.getByRole('region', { name: m.timeline.card.period }))
			.not.toBeInTheDocument();
	});

	it('shows an artwork older than 40000 BCE in prehistory', async () => {
		localStorage.setItem(ERA_KEY, 'prehistory');
		renderTimeline([
			testArtwork(1, 'Malowidła z Sulawesi', { yearTo: -43500, date: '43500 p.n.e.' })
		]);

		await expectEra('Prehistoria');
		await expect
			.element(page.getByRole('button', { name: 'Malowidła z Sulawesi, 43500 p.n.e.' }))
			.toBeInTheDocument();
	});

	it('keeps the dots and events as buttons in a group, with the slider on the reading line year', async () => {
		renderTimeline([testArtwork(7, 'Straż nocna', { yearTo: 1642, date: '1642' })], undefined, [
			testEvent('war', 'Wojna trzydziestoletnia', 1618, 1648)
		]);

		const group = page.getByRole('group', { name: m.timeline.stageGroup, exact: true });
		await expect
			.element(group.getByRole('button', { name: 'Straż nocna, 1642' }))
			.toBeInTheDocument();
		await expect
			.element(group.getByRole('button', { name: 'Wojna trzydziestoletnia, 1618–1648' }))
			.toBeInTheDocument();
		await expect.element(group.getByRole('slider', { name: m.timeline.stage })).toBeInTheDocument();
	});

	it('speaks the reading line only after the timeline stops', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([], undefined, [testEvent('war', 'Wojna trzydziestoletnia', 1618, 1648)]);
		const live = (): string =>
			document.querySelector('[aria-live="polite"].visually-hidden')?.textContent ?? '';
		await page.getByRole('button', { name: 'Stulecie', exact: true }).click();
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1640');
		await vi.waitFor(() => expect(live()).toContain('Wojna trzydziestoletnia'));

		for (let press = 0; press < 4; press++) {
			stage()
				.element()
				.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		}

		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1740');
		expect(live()).toContain('Wojna trzydziestoletnia');
		await vi.waitFor(() => expect(live()).not.toContain('Wojna trzydziestoletnia'));
	});

	it('says so under the stage when no artwork is at the reading line', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		renderTimeline([testArtwork(1, 'Straż nocna', { yearTo: 1642, date: '1642' })]);

		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		await press(
			page
				.getByRole('complementary', { name: m.atelier.filters.title })
				.getByRole('switch', { name: m.timeline.filters.readingArtworks })
		);
		await press(page.getByRole('button', { name: 'Pokolenie', exact: true }));

		await expect.element(page.getByText(m.timeline.readingArtworksNone)).toBeVisible();
	});

	it('comes back at the same era, scale, place and filters', async () => {
		localStorage.setItem(ERA_KEY, 'early_modern');
		const artworks = [
			testArtwork(1, 'Straż nocna', { yearTo: 1642, date: '1642', favourite: true })
		];
		const data = { session: testSession(), artworks, events: [], error: undefined, empty: false };
		const first = await render(TimelinePage, { data, params: {} });
		await page.getByRole('button', { name: 'Stulecie', exact: true }).click();
		for (let press = 0; press < 2; press++)
			stage()
				.element()
				.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1690');
		await press(page.getByRole('button', { name: m.atelier.filters.button }));
		await press(
			page
				.getByRole('complementary', { name: m.atelier.filters.title })
				.getByRole('button', { name: /Ulubione/ })
		);
		const saved = first.component.snapshot.capture();
		first.unmount();

		localStorage.setItem(ERA_KEY, 'modern');
		const second = await render(TimelinePage, { data, params: {} });
		second.component.snapshot.restore(saved);

		await expectEra('Nowożytność');
		await expect.element(stage()).toHaveAttribute('aria-valuenow', '1690');
		await expect
			.element(page.getByRole('button', { name: 'Stulecie', exact: true }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect
			.element(page.getByRole('list', { name: m.atelier.filters.activeLabel }))
			.toHaveTextContent(m.atelier.filters.fields.favourites);
	});
});
