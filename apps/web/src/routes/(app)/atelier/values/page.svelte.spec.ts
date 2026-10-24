import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import type { CardIndexData, OwnField } from '#lib/collection/types.ts';
import { CARD_INDEX_SEARCH_MIN_VALUES } from '#lib/collection/card-index.ts';
import { m } from '#lib/i18n/index.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { testSession } from '#lib/testing/auth.ts';
import { testOwnFields } from '#lib/testing/own-fields.ts';
import ValuesPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/values'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

function renderValues(
	index: CardIndexData = testCardIndex(),
	error?: string,
	ownFields: OwnField[] = []
): void {
	render(ValuesPage, {
		data: { session: testSession(), index, error, ownFields, ownFieldsError: undefined },
		params: {}
	});
}

function withMaterials(count: number): CardIndexData {
	const index = testCardIndex();
	const others = index.values.filter((record) => record.category !== 'material');
	const materials = Array.from({ length: count }, (_, position) => ({
		id: `material-${position}`,
		category: 'material' as const,
		name: position === 0 ? 'Marble' : `Material ${position}`,
		count: 1
	}));
	return { ...index, values: [...others, ...materials] };
}

function openValue(name: string, count: number): ReturnType<typeof page.getByRole> {
	return page
		.getByRole('link', {
			name: m.cardIndex.openValue(name, m.atelier.count(count)),
			exact: true
		})
		.first();
}

describe('card index page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		sessionStorage.clear();
		await page.viewport(1280, 800);
	});

	it('shows the timeline of eras with periods, styles and their numbers of artworks', async () => {
		renderValues();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.cardIndex.title);
		for (const era of Object.values(m.eras)) {
			await expect.element(page.getByRole('heading', { name: era.name })).toBeVisible();
		}
		await expect.element(openValue('Classical', 3)).toBeVisible();
		await expect.element(openValue('Doric', 2)).toBeVisible();
		await expect.element(openValue('Gothic', 2)).toBeVisible();
		await expect.element(page.getByText(m.cardIndex.emptyEra).first()).toBeVisible();
	});

	it('shows the periods without an era and the styles without a period', async () => {
		renderValues();

		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.periodsWithoutEra }))
			.toBeVisible();
		await expect.element(openValue('Orphan', 0)).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.stylesWithoutPeriod }))
			.toBeVisible();
		await expect.element(openValue('Loose', 0)).toBeVisible();
	});

	it('hides the groups without values', async () => {
		renderValues({ values: [], periodEras: [], stylePeriods: [] });

		await expect.element(page.getByText(m.cardIndex.emptyTimeline)).toBeVisible();
		expect(page.getByText(m.cardIndex.periodsWithoutEra).elements()).toHaveLength(0);
		expect(page.getByText(m.cardIndex.stylesWithoutPeriod).elements()).toHaveLength(0);
	});

	it('lists materials, authors and places alphabetically in their tabs', async () => {
		renderValues();

		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
		const items = page.getByRole('tabpanel').getByRole('listitem');
		await expect.element(items.first()).toHaveTextContent('Bronze');
		await expect.element(items.last()).toHaveTextContent('Marble');
		await page.getByRole('tab', { name: m.cardIndex.tabs.author }).click();
		await expect.element(openValue('Phidias', 1)).toBeVisible();
		await page.getByRole('tab', { name: m.cardIndex.tabs.location }).click();
		await expect.element(openValue('Athens', 2)).toBeVisible();
	});

	it('searches a list ignoring case and diacritics, and says when nothing matches', async () => {
		renderValues(withMaterials(CARD_INDEX_SEARCH_MIN_VALUES));
		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
		const search = page.getByRole('searchbox', { name: m.cardIndex.search.material });

		await search.fill('MARB');
		const items = page.getByRole('tabpanel').getByRole('listitem');
		await expect.element(items.first()).toHaveTextContent('Marble');
		expect(items.elements()).toHaveLength(1);

		await search.fill('xyz');
		await expect.element(page.getByText(m.cardIndex.noResults('xyz'))).toBeVisible();
		expect(items.elements()).toHaveLength(0);
	});

	it('offers the search only from the minimum number of values, filtered or not', async () => {
		renderValues(withMaterials(CARD_INDEX_SEARCH_MIN_VALUES - 1));

		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();

		await expect.element(page.getByRole('tabpanel').getByRole('listitem').first()).toBeVisible();
		expect(page.getByRole('searchbox').elements()).toHaveLength(0);
	});

	it('starts each tab with an empty search', async () => {
		const index = withMaterials(CARD_INDEX_SEARCH_MIN_VALUES);
		index.values.push(
			...Array.from({ length: CARD_INDEX_SEARCH_MIN_VALUES }, (_, position) => ({
				id: `author-${position}`,
				category: 'author' as const,
				name: `Author ${position}`,
				count: 1
			}))
		);
		renderValues(index);
		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
		await page.getByRole('searchbox', { name: m.cardIndex.search.material }).fill('marb');

		await page.getByRole('tab', { name: m.cardIndex.tabs.author }).click();

		await expect
			.element(page.getByRole('searchbox', { name: m.cardIndex.search.author }))
			.toHaveValue('');
	});

	it('says a list is empty', async () => {
		renderValues({ values: [], periodEras: [], stylePeriods: [] });

		await page.getByRole('tab', { name: m.cardIndex.tabs.author }).click();

		await expect.element(page.getByText(m.cardIndex.emptyList.author)).toBeVisible();
		expect(page.getByRole('searchbox').elements()).toHaveLength(0);
	});

	it('shows the learner own fields in their tab', async () => {
		renderValues(testCardIndex(), undefined, testOwnFields());

		await page.getByRole('tab', { name: m.cardIndex.tabs.own }).click();

		await expect.element(page.getByRole('heading', { name: 'Motifs' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.ownFields.add })).toBeVisible();
	});

	it('keeps the other tabs and says so in its tab when the own fields could not be loaded', async () => {
		render(ValuesPage, {
			data: {
				session: testSession(),
				index: testCardIndex(),
				error: undefined,
				ownFields: [],
				ownFieldsError: m.collectionErrors.network
			},
			params: {}
		});

		await page.getByRole('tab', { name: m.cardIndex.tabs.own }).click();

		await expect.element(page.getByText(m.ownFields.loadErrorTitle)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.ownFields.add }))
			.not.toBeInTheDocument();
		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
		await expect.element(page.getByText(m.ownFields.loadErrorTitle)).not.toBeInTheDocument();
	});

	it('shows a loading error instead of the tabs', async () => {
		renderValues(testCardIndex(), m.collectionErrors.network);

		await expect.element(page.getByText(m.cardIndex.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.collectionErrors.network)).toBeVisible();
		expect(page.getByRole('tablist').elements()).toHaveLength(0);
	});

	it('has no link back to the atelier, the menu moves between modules', async () => {
		renderValues();

		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.artworkView.back }))
			.not.toBeInTheDocument();
	});

	it('links each value to its page', async () => {
		renderValues();

		await expect
			.element(openValue('Classical', 3))
			.toHaveAttribute('href', '/atelier/values/period/period-classical');
		await expect
			.element(openValue('Doric', 2))
			.toHaveAttribute('href', '/atelier/values/style/style-doric');
		await page.getByRole('tab', { name: m.cardIndex.tabs.author }).click();
		await expect
			.element(openValue('Phidias', 1))
			.toHaveAttribute('href', '/atelier/values/author/author-phidias');
	});

	it('links the name of each era on the timeline to its page', async () => {
		renderValues();

		await expect
			.element(page.getByRole('link', { name: m.eras.antiquity.name, exact: true }))
			.toHaveAttribute('href', '/atelier/values/era/antiquity');
	});

	it('shows the message a value page left behind', async () => {
		navigation.state = { valueMessage: m.cardIndex.deleted('Loose') };
		renderValues();

		await expect.element(page.getByText(m.cardIndex.deleted('Loose'))).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/values', {
			state: {},
			shallow: true,
			replace: true
		});
	});

	it('opens on the tab the learner used last', async () => {
		renderValues();
		await page.getByRole('tab', { name: m.cardIndex.tabs.location }).click();
		await expect.element(openValue('Athens', 2)).toBeVisible();

		document.body.replaceChildren();
		renderValues();

		await expect
			.element(page.getByRole('tab', { name: m.cardIndex.tabs.location }))
			.toHaveAttribute('aria-selected', 'true');
	});

	it('keeps the tab and the search when the learner comes back', async () => {
		const index = withMaterials(CARD_INDEX_SEARCH_MIN_VALUES);
		const first = await render(ValuesPage, {
			data: {
				session: testSession(),
				index,
				error: undefined,
				ownFields: [],
				ownFieldsError: undefined
			},
			params: {}
		});
		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
		await page.getByRole('searchbox', { name: m.cardIndex.search.material }).fill('marb');
		const saved = first.component.snapshot.capture();
		first.unmount();

		const second = await render(ValuesPage, {
			data: {
				session: testSession(),
				index,
				error: undefined,
				ownFields: [],
				ownFieldsError: undefined
			},
			params: {}
		});
		second.component.snapshot.restore(saved);

		await expect
			.element(page.getByRole('tab', { name: m.cardIndex.tabs.material }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('searchbox', { name: m.cardIndex.search.material }))
			.toHaveValue('marb');
	});

	it('scrolls back to the saved place after the restored search moved the page', async () => {
		const index = withMaterials(150);
		const first = await render(ValuesPage, {
			data: {
				session: testSession(),
				index,
				error: undefined,
				ownFields: [],
				ownFieldsError: undefined
			},
			params: {}
		});
		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
		await page.getByRole('searchbox', { name: m.cardIndex.search.material }).fill('1');
		await expect.element(openValue('Material 2', 1)).not.toBeInTheDocument();
		const place = Math.round((document.documentElement.scrollHeight - window.innerHeight) / 2);
		window.scrollTo({ top: place, behavior: 'instant' });
		const saved = first.component.snapshot.capture();
		first.unmount();

		const second = await render(ValuesPage, {
			data: {
				session: testSession(),
				index,
				error: undefined,
				ownFields: [],
				ownFieldsError: undefined
			},
			params: {}
		});
		window.scrollTo({ top: place, behavior: 'instant' });
		second.component.snapshot.restore(saved);
		window.scrollTo({ top: place / 2, behavior: 'instant' });

		await expect.element(openValue('Material 2', 1)).not.toBeInTheDocument();
		await expect.poll(() => window.scrollY).toBe(place);
		expect(saved).toEqual({ tab: 'material', query: '1', scroll: place });
	});

	it('ignores a snapshot with a tab it does not know', async () => {
		const shown = await render(ValuesPage, {
			data: {
				session: testSession(),
				index: testCardIndex(),
				error: undefined,
				ownFields: [],
				ownFieldsError: undefined
			},
			params: {}
		});

		shown.component.snapshot.restore({ tab: 'colours', query: 'x' });

		await expect
			.element(page.getByRole('tab', { name: m.cardIndex.tabs.timeline }))
			.toHaveAttribute('aria-selected', 'true');
	});
});
