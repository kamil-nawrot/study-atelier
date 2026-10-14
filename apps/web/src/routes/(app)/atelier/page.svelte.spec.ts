import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, invalidateAll } from '$app/navigation';
import { refreshExpiredImages } from '#lib/collection/artworks.ts';
import type { WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { pending, TEST_EMAIL, testSession } from '#lib/testing/auth.ts';
import AtelierPage from './+page.svelte';
import '@study-atelier/ui/styles.css';

const navigation = vi.hoisted(() => ({
	state: {} as App.PageState,
	url: new URL('http://localhost/atelier')
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));
vi.mock('#lib/collection/artworks.ts', () => ({
	refreshExpiredImages: vi.fn(),
	resolveImages: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const signOut = vi.mocked(supabase.auth.signOut);

const artworks = [
	testArtwork(3, 'Déjeuner sur l’herbe'),
	testArtwork(2, 'Starry Night', { authors: [], date: undefined }),
	testArtwork(1, 'Night Watch', { image: undefined })
];

function renderAtelier(list: WallArtwork[] = artworks, error?: string): void {
	render(AtelierPage, { data: { session: testSession(), artworks: list, error }, params: {} });
}

const dated = [
	testArtwork(1, 'Mona Lisa', { year: 1503, eraCode: 'early_modern' }),
	testArtwork(2, 'Water Lilies', { year: 1906, eraCode: 'modern' }),
	testArtwork(3, 'Impression, Sunrise', { year: 1872, eraCode: 'modern' }),
	testArtwork(4, 'Untitled study', { year: 1800, eraCode: null })
];

function manyPeriods(): WallArtwork[] {
	return (
		[
			['early_modern', 1500],
			['modern', 1850],
			['contemporary', 1960]
		] as const
	).flatMap(([eraCode, year], block) =>
		[0, 1, 2, 3].map((position) =>
			testArtwork(block * 4 + position + 1, `${m.eras[eraCode].name} ${position + 1}`, {
				year: year + position,
				eraCode
			})
		)
	);
}

function orderSelect(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.atelier.sort.label });
}

const styled = [
	testArtwork(1, 'Mona Lisa', {
		year: 1503,
		eraCode: 'early_modern',
		typeCode: 'painting',
		styles: ['Renaissance']
	}),
	testArtwork(2, 'Water Lilies', {
		year: 1906,
		eraCode: 'modern',
		typeCode: 'painting',
		styles: ['Impressionism'],
		authors: ['Monet']
	}),
	testArtwork(3, 'Impression, Sunrise', {
		year: 1872,
		eraCode: 'modern',
		typeCode: 'painting',
		styles: ['Impressionism'],
		authors: ['Monet'],
		hasImage: false
	}),
	testArtwork(4, 'The Thinker', { year: 1904, eraCode: 'modern', typeCode: 'sculpture' })
];

function filtersButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: new RegExp(`^${m.atelier.filters.button}`) });
}

function eraTile(code: keyof typeof m.eras): ReturnType<typeof page.getByRole> {
	return page.getByRole('checkbox', { name: new RegExp(`^${m.eras[code].name}`) });
}

function titlesOnTheWall(list: WallArtwork[]): string[] {
	return page
		.getByRole('link')
		.elements()
		.flatMap((link) => list.find((artwork) => link.textContent?.includes(artwork.title)) ?? [])
		.map((artwork) => artwork.title);
}

function scrollToTheEnd(): void {
	window.scrollTo({ top: document.documentElement.scrollHeight });
}

function searchField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('searchbox', { name: m.atelier.search });
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
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(m.atelier.emptyTitle);
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

	describe('on a larger screen', () => {
		it('expands and collapses the side menu', async () => {
			renderAtelier();

			await page.getByRole('button', { name: m.menu.expand }).click();

			await expect
				.element(page.getByRole('button', { name: m.menu.collapse }))
				.toHaveAttribute('aria-expanded', 'true');
			await expect.element(page.getByRole('img', { name: m.app.name })).toBeVisible();

			await page.getByRole('button', { name: m.menu.collapse }).click();

			await expect
				.element(page.getByRole('button', { name: m.menu.expand }))
				.toHaveAttribute('aria-expanded', 'false');
		});

		it('links to the trash and has no menu icon in the top bar', async () => {
			renderAtelier();

			await expect
				.element(page.getByRole('link', { name: m.menu.trash }))
				.toHaveAttribute('href', '/atelier/trash');
			await expect.element(page.getByText(TEST_EMAIL)).toBeInTheDocument();
			await expect.element(page.getByRole('button', { name: m.menu.open })).not.toBeInTheDocument();
		});

		it('signs out and returns to sign-in', async () => {
			signOut.mockResolvedValue({ error: null });
			renderAtelier();

			await page.getByRole('button', { name: m.menu.signOut }).click();

			await vi.waitFor(() =>
				expect(goto).toHaveBeenCalledWith('/sign-in', { invalidateAll: true })
			);
			expect(signOut).toHaveBeenCalledOnce();
		});

		it('disables sign out while signing out', async () => {
			signOut.mockReturnValue(pending());
			renderAtelier();

			await page.getByRole('button', { name: m.menu.signOut }).click();

			await expect.element(page.getByRole('button', { name: m.menu.signOut })).toBeDisabled();
			expect(goto).not.toHaveBeenCalled();
		});
	});

	describe('on a phone', () => {
		beforeEach(async () => {
			await page.viewport(390, 800);
		});

		it('opens the menu from the top bar and closes it', async () => {
			renderAtelier();

			await expect
				.element(page.getByRole('button', { name: m.menu.expand }))
				.not.toBeInTheDocument();

			await page.getByRole('button', { name: m.menu.open }).click();

			const drawer = page.getByRole('dialog', { name: m.menu.label });
			await expect.element(drawer).toBeVisible();
			await expect.element(drawer.getByRole('link', { name: m.menu.trash })).toBeVisible();
			await expect.element(drawer.getByRole('button', { name: m.menu.signOut })).toBeVisible();

			await page.getByRole('button', { name: m.menu.close }).click();

			await expect.element(drawer).not.toBeInTheDocument();
		});

		it('shows the add button as an icon with an accessible name', async () => {
			renderAtelier();

			await expect.element(page.getByRole('link', { name: m.atelier.add })).toBeVisible();
			await expect.element(page.getByText(m.atelier.add, { exact: true })).not.toBeVisible();
		});
	});

	describe('ordered by period', () => {
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

		it('shows eras in their fixed order with artworks by year and hides those without an era', async () => {
			renderAtelier(dated);

			await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);

			await expect.element(page.getByText(m.atelier.filteredCount(3, 4))).toBeVisible();
			expect(titlesOnTheWall(dated)).toEqual(['Mona Lisa', 'Impression, Sunrise', 'Water Lilies']);
		});

		it('puts the eras in their fixed order even when the years disagree', async () => {
			const both = [
				testArtwork(1, 'Dated Late', { year: 1700, eraCode: 'antiquity' }),
				testArtwork(2, 'Dated Early', { year: 1500, eraCode: 'modern' })
			];
			renderAtelier(both);

			await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);

			expect(titlesOnTheWall(both)).toEqual(['Dated Late', 'Dated Early']);
			await expect.element(page.getByText(m.atelier.count(2))).toBeVisible();
		});

		it('searches inside the order', async () => {
			renderAtelier(dated);
			await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);

			await searchField().fill('water');

			expect(titlesOnTheWall(dated)).toEqual(['Water Lilies']);
			await expect.element(page.getByText(m.atelier.filteredCount(1, 4))).toBeVisible();
		});

		it('remembers the order on the device', async () => {
			const view = await render(AtelierPage, {
				data: { session: testSession(), artworks: dated },
				params: {}
			});
			await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);
			await view.unmount();

			renderAtelier(dated);

			await expect.element(orderSelect()).toHaveDisplayValue(m.atelier.sort.period);
			expect(titlesOnTheWall(dated)).toEqual(['Mona Lisa', 'Impression, Sunrise', 'Water Lilies']);
		});

		it('says no artwork has a period yet and goes back to the recent order', async () => {
			renderAtelier(artworks);
			await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);

			await expect
				.element(page.getByRole('heading', { level: 2 }))
				.toHaveTextContent(m.atelier.periods.emptyTitle);

			await page.getByRole('button', { name: m.atelier.periods.showRecent }).click();

			await expect.element(orderSelect()).toHaveDisplayValue(m.atelier.sort.recent);
			await expect.element(page.getByText('Starry Night')).toBeVisible();
		});

		it('keeps the order select enabled only when there are artworks', async () => {
			renderAtelier([]);

			await expect.element(orderSelect()).toBeDisabled();
		});

		describe('on a phone', () => {
			beforeEach(async () => {
				await page.viewport(390, 800);
			});

			it('keeps the order select in the view dialog, not in the top bar', async () => {
				renderAtelier(dated);

				await expect.element(orderSelect()).not.toBeInTheDocument();

				await page.getByRole('button', { name: m.atelier.filters.viewButton }).click();

				await expect.element(orderSelect()).toBeVisible();
			});

			it('follows the scroll in a strip under the top bar', async () => {
				renderAtelier(manyPeriods());
				await page.getByRole('button', { name: m.atelier.filters.viewButton }).click();
				await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);
				await page.getByRole('button', { name: m.atelier.filters.showResults(12) }).click();

				const strip = page.getByRole('complementary', { name: m.atelier.periods.label });
				await expect.element(strip).toHaveTextContent(m.eras.early_modern.name);
				await expect.element(strip).toHaveTextContent('1500 – 1503');

				scrollToTheEnd();

				await expect.element(strip).toHaveTextContent(m.eras.contemporary.name);
				await expect.element(strip).toHaveTextContent('1960 – 1963');
			});

			it('has no strip in the recent order', async () => {
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

			it('shows the rail at the right edge instead of the strip', async () => {
				renderAtelier(manyPeriods());
				await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);

				const rail = page.getByRole('complementary', { name: m.atelier.periods.label });
				await expect.element(rail).toBeVisible();
				await expect.element(rail).toHaveTextContent(m.eras.modern.name);
				expect(rail.element().getBoundingClientRect().right).toBe(
					document.documentElement.clientWidth
				);
				expect(page.getByRole('complementary').elements()).toHaveLength(1);
			});

			it('highlights the first era at the top and the last one at the end', async () => {
				renderAtelier(manyPeriods());
				await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);
				const rail = page.getByRole('complementary', { name: m.atelier.periods.label });
				const current = rail.getByRole('listitem').filter({ hasText: /./ });

				await expect
					.element(current.filter({ hasText: m.eras.early_modern.name }))
					.toHaveAttribute('aria-current', 'true');
				expect(rail.getByRole('listitem').elements()[0].getBoundingClientRect().top).toBe(
					rail.element().getBoundingClientRect().top
				);

				scrollToTheEnd();

				await expect
					.element(current.filter({ hasText: m.eras.contemporary.name }))
					.toHaveAttribute('aria-current', 'true');
				await expect
					.element(current.filter({ hasText: m.eras.early_modern.name }))
					.not.toHaveAttribute('aria-current');
			});

			it('shows the era icon only on the current era', async () => {
				renderAtelier(manyPeriods());
				await userEvent.selectOptions(orderSelect(), m.atelier.sort.period);
				const rail = page.getByRole('complementary', { name: m.atelier.periods.label });

				expect(rail.element().querySelectorAll('svg')).toHaveLength(1);

				scrollToTheEnd();

				await vi.waitFor(() =>
					expect(
						rail.getByRole('listitem').filter({ hasText: m.eras.contemporary.name }).element()
					).toContainElement(rail.element().querySelector('svg'))
				);
				expect(rail.element().querySelectorAll('svg')).toHaveLength(1);
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

			expect(goto).toHaveBeenLastCalledWith(
				'/atelier?epoka=modern',
				expect.objectContaining({ replace: true, shallow: true })
			);
		});

		it('reads the filter from the address', async () => {
			navigation.url = new URL('http://localhost/atelier?epoka=modern&styl=Impressionism');
			renderAtelier(styled);

			expect(titlesOnTheWall(styled)).toEqual(['Water Lilies', 'Impression, Sunrise']);
			await expect.element(filtersButton()).toHaveTextContent(m.atelier.filters.buttonWithCount(2));
		});

		it('ignores values in the address that no artwork has', async () => {
			navigation.url = new URL('http://localhost/atelier?styl=Gone&epoka=nope');
			renderAtelier(styled);

			expect(titlesOnTheWall(styled)).toHaveLength(4);
			await expect.element(page.getByText(m.atelier.count(4))).toBeVisible();
		});

		it('remembers the artworks it shows, in their order, for the artwork view', async () => {
			navigation.url = new URL('http://localhost/atelier?epoka=modern');
			renderAtelier(styled);
			const shownNumbers = (): number[] =>
				titlesOnTheWall(styled).map(
					(title) => styled.find((artwork) => artwork.title === title)?.number ?? 0
				);
			const remembered = (): unknown =>
				JSON.parse(sessionStorage.getItem('study-atelier:wall-sequence') ?? 'null');

			await expect.element(page.getByText(m.atelier.filteredCount(3, 4))).toBeVisible();
			expect(remembered()).toEqual({ query: 'epoka=modern', numbers: shownNumbers() });

			await searchField().fill('impression');

			await expect.element(page.getByText(m.atelier.filteredCount(1, 4))).toBeVisible();
			expect(remembered()).toEqual({ query: 'epoka=modern', numbers: [3] });
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
});
