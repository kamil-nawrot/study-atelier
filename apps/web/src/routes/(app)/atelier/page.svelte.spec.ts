import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, invalidateAll } from '$app/navigation';
import { refreshExpiredImages } from '#lib/wall/wall-data/wall-data.ts';
import { setFavourite } from '#lib/wall/favourite-data/favourite-data.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import {
	byAuthors,
	chooseGrouping,
	dated,
	eraTile,
	filtersButton,
	groupingButton,
	manyAuthors,
	manyPeriods,
	orderSelect,
	periods,
	scrollToTheEnd,
	searchField,
	styled,
	titlesOnTheWall
} from '#lib/testing/wall/wall.ts';
import AtelierPage from './+page.svelte';
import '@study-atelier/ui/styles.css';

const navigation = vi.hoisted(() => ({
	state: {} as App.PageState,
	data: {},
	url: new URL('http://localhost/atelier')
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	refreshExpiredImages: vi.fn(),
	resolveImages: vi.fn()
}));
vi.mock('#lib/wall/favourite-data/favourite-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/wall/favourite-data/favourite-data.ts')>()),
	setFavourite: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const artworks = [
	testArtwork(3, 'Déjeuner sur l’herbe'),
	testArtwork(2, 'Starry Night', { authors: [], date: undefined }),
	testArtwork(1, 'Night Watch', { image: undefined })
];

function renderAtelier(
	list: WallArtwork[] = artworks,
	error?: string,
	ownFields: OwnFieldDefinition[] = []
): void {
	render(AtelierPage, {
		data: { session: testSession(), artworks: list, error, ownFields },
		params: {}
	});
}

describe('atelier page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		localStorage.clear();
		sessionStorage.clear();
		window.scrollTo({ top: 0 });
		await page.viewport(1280, 800);
	});

	it('confirms an artwork moved to the trash and clears the state', async () => {
		navigation.state = { trashed: 42 };
		renderAtelier();

		await expect.element(page.getByText(m.trash.moved('#0042'))).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier', { state: {}, shallow: true, replace: true });
	});

	it('highlights the artwork just saved for a moment', async () => {
		vi.useFakeTimers();
		navigation.state = { highlight: 2 };
		renderAtelier();

		const saved = page.getByRole('listitem').filter({ hasText: 'Starry Night' });
		await expect.element(saved).toHaveClass('highlight');
		await expect
			.element(page.getByRole('listitem').filter({ hasText: 'Night Watch' }))
			.not.toHaveClass('highlight');

		vi.advanceTimersByTime(2000);
		vi.useRealTimers();

		await expect.element(saved).not.toHaveClass('highlight');
		expect(goto).toHaveBeenCalledWith('/atelier', { state: {}, shallow: true, replace: true });
	});

	it('shows every artwork with the count', async () => {
		renderAtelier();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.atelier.title);
		await expect.element(page.getByText(m.atelier.count(3))).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: /Déjeuner sur l’herbe/ }))
			.toHaveAttribute('href', '/atelier/3');
		await expect.element(page.getByText('Starry Night')).toBeVisible();
		await expect.element(page.getByText('Night Watch')).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.atelier.add }))
			.toHaveAttribute('href', '/atelier/new');
	});

	it('filters by title ignoring case and diacritics', async () => {
		renderAtelier();

		await searchField().fill('DEJEUNER');

		await expect.element(page.getByText('Déjeuner sur l’herbe')).toBeVisible();
		await expect.element(page.getByText('Starry Night')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.atelier.filteredCount(1, 3))).toBeVisible();
	});

	it('finds an artwork by any of its authors', async () => {
		renderAtelier(byAuthors);

		await searchField().fill('durer');

		expect(titlesOnTheWall(byAuthors)).toEqual(['Melancholia', 'Self-portrait']);
		await expect.element(page.getByText(m.atelier.filteredCount(2, 5))).toBeVisible();
	});

	it('says when nothing matches and clears the search', async () => {
		renderAtelier();

		await searchField().fill('sunflowers');

		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(m.atelier.noResultsTitle);
		await expect.element(page.getByText(m.atelier.noResults('sunflowers'))).toBeVisible();

		await page.getByRole('button', { name: m.atelier.clearSearch, exact: true }).first().click();

		await expect.element(searchField()).toHaveValue('');
		await expect.element(page.getByText('Starry Night')).toBeVisible();
	});

	it('invites the learner to add the first artwork in an empty atelier', async () => {
		renderAtelier([]);

		await expect
			.element(page.getByRole('heading', { level: 2, name: m.atelier.welcome.title }))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { level: 2, name: m.atelier.welcome.howTitle }))
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.atelier.addFirst }))
			.toHaveAttribute('href', '/atelier/new');
		await expect.element(searchField()).toBeDisabled();
		await expect.element(page.getByText(m.atelier.count(0))).not.toBeInTheDocument();
	});

	it('says when some images are unavailable and loads them again on request', async () => {
		renderAtelier([
			testArtwork(1, 'Night Watch', { image: undefined, imageUnavailable: true }),
			testArtwork(2, 'Starry Night')
		]);

		await expect.element(page.getByText(m.atelier.imagesUnavailableTitle)).toBeVisible();
		await page.getByRole('button', { name: m.atelier.retryImages }).click();

		expect(invalidateAll).toHaveBeenCalled();
	});

	it('does not warn about images when all of them are available', async () => {
		renderAtelier();

		await expect.element(page.getByText(m.atelier.imagesUnavailableTitle)).not.toBeInTheDocument();
	});

	it('shows an image again after its expired url was signed anew', async () => {
		const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
		const expired = testArtwork(1, 'Night Watch', {
			image: { src: 'data:image/png;base64,broken', width: 4, height: 5 },
			ownImagePath: 'user-id/artwork-1/image.jpg',
			imageSignedAt: 0
		});
		vi.mocked(refreshExpiredImages).mockResolvedValue([
			{ ...expired, image: { src: pixel, width: 4, height: 5 }, imageSignedAt: Date.now() }
		]);
		renderAtelier([expired]);

		await vi.waitFor(() => expect(refreshExpiredImages).toHaveBeenCalledWith([expired]), {
			timeout: 8000
		});
		await expect
			.element(page.getByRole('img', { name: 'Night Watch, Test Painter' }))
			.toBeVisible();
	});

	it('shows why the atelier did not load', async () => {
		renderAtelier([], m.collectionErrors.network);

		await expect.element(page.getByText(m.atelier.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.collectionErrors.network)).toBeVisible();
	});

	describe('on a phone', () => {
		beforeEach(async () => {
			await page.viewport(390, 800);
		});

		it('shows the add button as an icon with an accessible name', async () => {
			renderAtelier();

			await expect.element(page.getByRole('link', { name: m.atelier.add })).toBeVisible();
			await expect.element(page.getByText(m.atelier.add, { exact: true })).not.toBeVisible();
		});
	});

	describe('ordered by date of creation', () => {
		it('offers the order next to the search, most recently added first', async () => {
			renderAtelier(dated);

			await expect.element(orderSelect()).toHaveDisplayValue(m.atelier.sort.recent);
			expect(titlesOnTheWall(dated)).toEqual([
				'Mona Lisa',
				'Water Lilies',
				'Impression, Sunrise',
				'Untitled study'
			]);
		});

		it('orders the whole wall by year, without a rail', async () => {
			renderAtelier(dated);

			await userEvent.selectOptions(orderSelect(), m.atelier.sort.year);

			await expect.element(page.getByText(m.atelier.count(4))).toBeVisible();
			expect(titlesOnTheWall(dated)).toEqual([
				'Mona Lisa',
				'Untitled study',
				'Impression, Sunrise',
				'Water Lilies'
			]);
			await expect
				.element(page.getByRole('complementary', { name: m.atelier.periods.label }))
				.not.toBeInTheDocument();
		});

		it('remembers the order on the device', async () => {
			const view = await render(AtelierPage, {
				data: { session: testSession(), artworks: dated, ownFields: [] },
				params: {}
			});
			await userEvent.selectOptions(orderSelect(), m.atelier.sort.year);
			await view.unmount();

			renderAtelier(dated);

			await expect.element(orderSelect()).toHaveDisplayValue(m.atelier.sort.year);
		});

		it('keeps the order select enabled only when there are artworks', async () => {
			renderAtelier([]);

			await expect.element(orderSelect()).toBeDisabled();
		});
	});

	describe('grouped', () => {
		it('starts without groups', async () => {
			renderAtelier(dated);

			await expect
				.element(groupingButton())
				.toHaveAccessibleName(m.atelier.grouping.button(m.atelier.grouping.off));
			await expect.element(page.getByRole('heading', { level: 2 })).not.toBeInTheDocument();
		});

		it('gives every era a heading and its own wall, artworks without an era last', async () => {
			renderAtelier(dated);

			await chooseGrouping('era');

			const headings = page.getByRole('heading', { level: 2 }).elements();
			expect(headings.map((heading) => heading.textContent?.trim())).toEqual([
				`${m.eras.early_modern.name} 1`,
				`${m.eras.modern.name} 2`,
				`${m.atelier.grouping.noEra} 1`
			]);
			expect(titlesOnTheWall(dated)).toEqual([
				'Mona Lisa',
				'Water Lilies',
				'Impression, Sunrise',
				'Untitled study'
			]);
			await expect.element(page.getByText(m.atelier.count(4))).toBeVisible();
			expect(vi.mocked(goto)).toHaveBeenLastCalledWith('/atelier?group=era', {
				replace: true,
				reset: false
			});
		});

		it('orders the artworks inside each group by the chosen order', async () => {
			renderAtelier(dated);
			await userEvent.selectOptions(orderSelect(), m.atelier.sort.year);

			await chooseGrouping('era');

			expect(titlesOnTheWall(dated)).toEqual([
				'Mona Lisa',
				'Impression, Sunrise',
				'Water Lilies',
				'Untitled study'
			]);
		});

		it('nests the periods and styles, repeating an artwork in each of its styles', async () => {
			renderAtelier(periods);

			await chooseGrouping('style');

			const levels = (level: number): (string | undefined)[] =>
				page
					.getByRole('heading', { level })
					.elements()
					.map((heading) => heading.textContent?.trim());
			expect(levels(3)).toEqual(['renesans 1', 'barok 2', `${m.atelier.grouping.noPeriod} 1`]);
			expect(levels(4)).toEqual([
				'wysoki renesans 1',
				'barok 1',
				'caravaggionizm 1',
				`${m.atelier.grouping.noStyle} 1`
			]);
			await expect.element(page.getByText(m.atelier.count(4))).toBeVisible();
		});

		it('collapses a group and every group at once', async () => {
			renderAtelier(dated);
			await chooseGrouping('era');

			await page.getByRole('heading', { level: 2, name: m.eras.modern.name }).click();

			expect(titlesOnTheWall(dated)).toEqual(['Mona Lisa', 'Untitled study']);
			await page.getByRole('button', { name: m.atelier.grouping.expandAll }).click();
			expect(titlesOnTheWall(dated)).toHaveLength(4);

			await page.getByRole('button', { name: m.atelier.grouping.collapseAll }).click();

			expect(titlesOnTheWall(dated)).toEqual([]);
		});

		it('keeps filtering and searching inside the groups', async () => {
			renderAtelier(dated);
			await chooseGrouping('era');

			await searchField().fill('water');

			expect(page.getByRole('heading', { level: 2 }).elements()).toHaveLength(1);
			await expect.element(page.getByText(m.atelier.filteredCount(1, 4))).toBeVisible();
		});

		it('flips through the artworks in the order of the groups, each once', async () => {
			renderAtelier(periods);

			await chooseGrouping('style');

			await vi.waitFor(() =>
				expect(JSON.parse(sessionStorage.getItem('study-atelier:wall-sequence') ?? 'null')).toEqual(
					{ query: 'group=style', numbers: [1, 2, 3, 4] }
				)
			);
		});

		describe('on a phone', () => {
			beforeEach(async () => {
				await page.viewport(390, 800);
			});

			it('chooses the grouping under the title and follows the eras in the strip', async () => {
				renderAtelier(manyPeriods());

				await chooseGrouping('era');

				const strip = page.getByRole('complementary', { name: m.atelier.periods.label });
				await expect.element(strip).toHaveTextContent(m.eras.early_modern.name);

				scrollToTheEnd();

				await expect.element(strip).toHaveTextContent(m.eras.contemporary.name);
			});

			it('has no strip without groups', async () => {
				renderAtelier(manyPeriods());

				await expect
					.element(page.getByRole('complementary', { name: m.atelier.periods.label }))
					.not.toBeInTheDocument();
			});
		});

		describe('on a wide screen', () => {
			beforeEach(async () => {
				await page.viewport(1900, 900);
			});

			it('has no rail when every artwork falls into one era', async () => {
				renderAtelier(manyPeriods().slice(0, 4));
				await chooseGrouping('era');

				await expect
					.element(page.getByRole('complementary', { name: m.atelier.periods.label }))
					.not.toBeInTheDocument();
			});

			it('shows the eras on the rail at the right edge, the current one highlighted', async () => {
				renderAtelier(manyPeriods());
				await chooseGrouping('period');
				const rail = page.getByRole('complementary', { name: m.atelier.periods.label });
				const current = rail.getByRole('listitem').filter({ hasText: /./ });

				await expect.element(rail).toBeVisible();
				expect(rail.element().getBoundingClientRect().right).toBe(
					document.documentElement.getBoundingClientRect().right
				);
				await expect
					.element(current.filter({ hasText: m.eras.early_modern.name }))
					.toHaveAttribute('aria-current', 'true');

				scrollToTheEnd();

				await expect
					.element(current.filter({ hasText: m.eras.contemporary.name }))
					.toHaveAttribute('aria-current', 'true');
			});
		});
	});

	describe('ordered by author', () => {
		it('makes a block per first author, A to Z, by year inside, unknown author last', async () => {
			renderAtelier(byAuthors);

			await userEvent.selectOptions(orderSelect(), m.atelier.sort.author);

			await expect.element(page.getByText(m.atelier.count(5))).toBeVisible();
			expect(JSON.parse(sessionStorage.getItem('study-atelier:wall-sequence') ?? 'null')).toEqual({
				query: '',
				numbers: [5, 3, 4, 1, 2]
			});
		});

		it('remembers the order on the device', async () => {
			const view = await render(AtelierPage, {
				data: { session: testSession(), artworks: byAuthors, ownFields: [] },
				params: {}
			});
			await userEvent.selectOptions(orderSelect(), m.atelier.sort.author);
			await view.unmount();

			renderAtelier(byAuthors);

			await expect.element(orderSelect()).toHaveDisplayValue(m.atelier.sort.author);
		});

		describe('on a phone', () => {
			beforeEach(async () => {
				await page.viewport(390, 800);
				localStorage.setItem('study-atelier:wall-order', 'author');
			});

			it('names the current author and their years in the strip', async () => {
				renderAtelier(byAuthors);

				const strip = page.getByRole('complementary', { name: m.atelier.authors.label });
				await expect.element(strip).toHaveTextContent('Albrecht Dürer');
				await expect.element(strip).toHaveTextContent('1500 – 1514');
				expect(strip.element().querySelectorAll('li')).toHaveLength(3);
			});

			it('leaves out the marks of the strip when there are too many authors to fit', async () => {
				renderAtelier(manyAuthors(20));

				const strip = page.getByRole('complementary', { name: m.atelier.authors.label });
				await expect.element(strip).toHaveTextContent('Author 01');
				expect(strip.element().querySelectorAll('li')).toHaveLength(0);
			});
		});

		describe('on a wide screen', () => {
			beforeEach(async () => {
				await page.viewport(1900, 900);
				localStorage.setItem('study-atelier:wall-order', 'author');
			});

			it('shows the authors on the rail without an era icon', async () => {
				renderAtelier(byAuthors);

				const rail = page.getByRole('complementary', { name: m.atelier.authors.label });
				await expect
					.element(rail.getByRole('listitem').filter({ hasText: 'Albrecht Dürer' }))
					.toHaveAttribute('aria-current', 'true');
				await expect.element(rail).toHaveTextContent(m.atelier.filters.unknownAuthor);
				expect(rail.element().querySelectorAll('svg')).toHaveLength(0);
			});

			it('has no rail when every artwork has the same author', async () => {
				renderAtelier(manyAuthors(1));

				await expect
					.element(page.getByRole('complementary', { name: m.atelier.authors.label }))
					.not.toBeInTheDocument();
			});

			it('names only the current author when the rail is too short for every name', async () => {
				renderAtelier(manyAuthors(80));

				const rail = page.getByRole('complementary', { name: m.atelier.authors.label });
				await expect.element(rail.getByText('Author 01')).toBeVisible();
				await expect.element(rail.getByText('Author 02')).not.toBeVisible();
			});
		});
	});

	describe('filters', () => {
		beforeEach(() => {
			navigation.url = new URL('http://localhost/atelier');
		});

		it('starts with the filter panel closed', async () => {
			renderAtelier(styled);

			await expect
				.element(page.getByRole('complementary', { name: m.atelier.filters.title }))
				.not.toBeInTheDocument();
			await expect.element(filtersButton()).toHaveAttribute('aria-expanded', 'false');
		});

		it('opens a side panel with the filters and closes it again', async () => {
			renderAtelier(styled);

			await filtersButton().click();

			await expect
				.element(page.getByRole('complementary', { name: m.atelier.filters.title }))
				.toBeVisible();

			await page.getByRole('button', { name: m.atelier.filters.closePanel }).click();

			await expect
				.element(page.getByRole('complementary', { name: m.atelier.filters.title }))
				.not.toBeInTheDocument();
		});

		it('keeps the panel header in view while the panel is scrolled', async () => {
			renderAtelier(styled);

			await filtersButton().click();

			const heading = page.getByRole('heading', { name: m.atelier.filters.title });
			await expect.element(heading).toBeVisible();
			expect(getComputedStyle(heading.element().parentElement as HTMLElement).position).toBe(
				'sticky'
			);
		});

		it('narrows the wall as soon as a value is chosen and counts the result', async () => {
			renderAtelier(styled);
			await filtersButton().click();

			await eraTile('modern').click();

			expect(titlesOnTheWall(styled)).toEqual([
				'Water Lilies',
				'Impression, Sunrise',
				'The Thinker'
			]);
			await expect.element(page.getByText(m.atelier.filteredCount(3, 4)).first()).toBeVisible();
		});

		it('combines any of the values of a field and every field', async () => {
			renderAtelier(styled);
			await filtersButton().click();

			await eraTile('modern').click();
			await page.getByRole('button', { name: /^Impressionism/ }).click();

			expect(titlesOnTheWall(styled)).toEqual(['Water Lilies', 'Impression, Sunrise']);

			await eraTile('early_modern').click();

			expect(titlesOnTheWall(styled)).toEqual(['Water Lilies', 'Impression, Sunrise']);
		});

		it('shows the chosen filters as tags and removes one of them', async () => {
			renderAtelier(styled);
			await filtersButton().click();
			await eraTile('modern').click();
			await page.getByRole('button', { name: /^Impressionism/ }).click();

			const tags = page.getByRole('list', { name: m.atelier.filters.activeLabel });
			await expect
				.element(tags)
				.toHaveTextContent(`${m.atelier.filters.tagFields.styles} Impressionism`);

			await page
				.getByRole('button', {
					name: m.atelier.filters.removeTag(`${m.atelier.filters.tagFields.styles} Impressionism`)
				})
				.click();

			expect(titlesOnTheWall(styled)).toEqual([
				'Water Lilies',
				'Impression, Sunrise',
				'The Thinker'
			]);
		});

		it('filters by a year range with p.n.e. and finds what is missing', async () => {
			renderAtelier(styled);
			await filtersButton().click();

			await page.getByRole('textbox', { name: m.atelier.filters.yearFrom }).fill('1800');
			await page.getByRole('textbox', { name: m.atelier.filters.yearTo }).fill('1905');

			expect(titlesOnTheWall(styled)).toEqual(['Impression, Sunrise', 'The Thinker']);

			await page
				.getByRole('button', { name: new RegExp(`^${m.atelier.filters.missing.image}`) })
				.click();

			expect(titlesOnTheWall(styled)).toEqual(['Impression, Sunrise']);
		});

		it('clears every filter', async () => {
			renderAtelier(styled);
			await filtersButton().click();
			await eraTile('modern').click();

			await page.getByRole('button', { name: m.atelier.filters.clear }).first().click();

			expect(titlesOnTheWall(styled)).toHaveLength(4);
			await expect.element(page.getByText(m.atelier.count(4))).toBeVisible();
		});

		it('says nothing matches and clears the filters from there', async () => {
			renderAtelier(styled);
			await filtersButton().click();
			await page.getByRole('textbox', { name: m.atelier.filters.yearFrom }).fill('1');
			await page.getByRole('textbox', { name: m.atelier.filters.yearTo }).fill('10');

			await expect.element(page.getByText(m.atelier.filters.noResults)).toBeVisible();

			await page
				.getByRole('main')
				.getByRole('button', { name: m.atelier.filters.clear })
				.first()
				.click();

			expect(titlesOnTheWall(styled)).toHaveLength(4);
		});

		it('searches by title inside the filter', async () => {
			renderAtelier(styled);
			await filtersButton().click();
			await eraTile('modern').click();

			await searchField().fill('water');

			expect(titlesOnTheWall(styled)).toEqual(['Water Lilies']);
		});

		it('keeps the filter in the address', async () => {
			renderAtelier(styled);
			await filtersButton().click();

			await eraTile('modern').click();

			expect(goto).toHaveBeenLastCalledWith('/atelier?era=modern', {
				replace: true,
				reset: false
			});
		});

		it('reads the filter from the address', async () => {
			navigation.url = new URL('http://localhost/atelier?era=modern&style=Impressionism');
			renderAtelier(styled);

			expect(titlesOnTheWall(styled)).toEqual(['Water Lilies', 'Impression, Sunrise']);
			await expect
				.element(filtersButton())
				.toHaveAccessibleName(m.atelier.filters.buttonWithCount(2));
		});

		it('ignores values in the address that no artwork has', async () => {
			navigation.url = new URL('http://localhost/atelier?style=Gone&era=nope');
			renderAtelier(styled);

			expect(titlesOnTheWall(styled)).toHaveLength(4);
			await expect.element(page.getByText(m.atelier.count(4))).toBeVisible();
		});

		it('opens a link saved with the old Polish names as the whole wall', async () => {
			navigation.url = new URL('http://localhost/atelier?epoka=modern&grupuj=epoka&ulubione=1');
			renderAtelier(styled);

			expect(titlesOnTheWall(styled)).toHaveLength(4);
			await expect.element(page.getByText(m.atelier.count(4))).toBeVisible();
			await expect.element(filtersButton()).toHaveAccessibleName(m.atelier.filters.button);
		});

		it('remembers the artworks it shows, in their order, for the artwork view', async () => {
			navigation.url = new URL('http://localhost/atelier?era=modern');
			renderAtelier(styled);
			const shownNumbers = (): number[] =>
				titlesOnTheWall(styled).map(
					(title) => styled.find((artwork) => artwork.title === title)?.number ?? 0
				);
			const remembered = (): unknown =>
				JSON.parse(sessionStorage.getItem('study-atelier:wall-sequence') ?? 'null');

			await expect.element(page.getByText(m.atelier.filteredCount(3, 4))).toBeVisible();
			expect(remembered()).toEqual({ query: 'era=modern', numbers: shownNumbers() });

			await searchField().fill('impression');

			await expect.element(page.getByText(m.atelier.filteredCount(1, 4))).toBeVisible();
			expect(remembered()).toEqual({ query: 'era=modern', numbers: [3] });
		});

		it('has no filter button when the atelier is empty', async () => {
			renderAtelier([]);

			await expect.element(filtersButton()).toBeDisabled();
		});

		describe('on a phone', () => {
			beforeEach(async () => {
				await page.viewport(390, 800);
			});

			it('opens a view dialog with the order and the filters', async () => {
				renderAtelier(styled);

				await page.getByRole('button', { name: m.atelier.filters.viewButton }).click();

				await expect
					.element(page.getByRole('dialog', { name: m.atelier.filters.viewTitle }))
					.toBeVisible();
				await expect.element(orderSelect()).toBeVisible();
				await expect.element(eraTile('modern')).toBeVisible();
			});

			it('keeps the view dialog within the width of the screen', async () => {
				renderAtelier(styled);
				await page.getByRole('button', { name: m.atelier.filters.viewButton }).click();
				await expect.element(orderSelect()).toBeVisible();

				const body = page
					.getByRole('dialog', { name: m.atelier.filters.viewTitle })
					.element()
					.querySelector('.body');
				expect(body?.scrollWidth).toBe(body?.clientWidth);
			});

			it('shows how many artworks the filters leave and closes with that button', async () => {
				renderAtelier(styled);
				await page.getByRole('button', { name: m.atelier.filters.viewButton }).click();

				await eraTile('modern').click();
				await page.getByRole('button', { name: m.atelier.filters.showResults(3) }).click();

				await expect
					.element(page.getByRole('dialog', { name: m.atelier.filters.viewTitle }))
					.not.toBeInTheDocument();
				expect(titlesOnTheWall(styled)).toEqual([
					'Water Lilies',
					'Impression, Sunrise',
					'The Thinker'
				]);
			});
		});
	});

	it('marks a tile as a favourite with its heart and confirms it', async () => {
		vi.mocked(setFavourite).mockResolvedValue({});
		await page.viewport(1000, 800);
		renderAtelier();

		await page.getByRole('button', { name: m.favourite.add }).first().click();

		expect(setFavourite).toHaveBeenCalledWith('artwork-3', true);
		await expect
			.element(page.getByRole('button', { name: m.favourite.remove }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText(m.favourite.added)).toBeVisible();
	});

	it('puts the heart back and shows an alert when the save fails', async () => {
		vi.mocked(setFavourite).mockResolvedValue({ error: m.favourite.failed });
		await page.viewport(1000, 800);
		renderAtelier();

		await page.getByRole('button', { name: m.favourite.add }).first().click();

		await expect.element(page.getByRole('alert')).toHaveTextContent(m.favourite.failed);
		await expect
			.element(page.getByRole('button', { name: m.favourite.remove }))
			.not.toBeInTheDocument();
	});

	it('keeps loaded images loaded when a heart is toggled', async () => {
		vi.mocked(setFavourite).mockResolvedValue({});
		await page.viewport(1000, 800);
		const loaded = testArtwork(1, 'Loaded', {
			image: {
				src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
				width: 4,
				height: 5
			}
		});
		renderAtelier([loaded]);
		await expect.poll(() => document.querySelectorAll('[aria-busy="true"]').length).toBe(0);

		await page.getByRole('button', { name: m.favourite.add }).click();
		await expect.element(page.getByRole('button', { name: m.favourite.remove })).toBeVisible();

		await expect.poll(() => document.querySelectorAll('[aria-busy="true"]').length).toBe(0);
	});
});
