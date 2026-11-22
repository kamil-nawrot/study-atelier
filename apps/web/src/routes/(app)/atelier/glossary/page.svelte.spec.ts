import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, snapshot } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { GLOSSARY_INDEX_MIN_ENTRIES } from '#lib/glossary/glossary/glossary.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { AtlasSymbol } from '#lib/symbols/types/atlas-symbol.ts';
import { loadSymbolAtlas } from '#lib/symbols/symbols-data/symbols-data.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testEntry, testGlossary } from '#lib/testing/glossary/glossary.ts';
import GlossaryPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/glossary'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), snapshot: vi.fn() }));

type Registered = { capture: () => unknown; restore: (value: unknown) => void };
const registered = (): Registered =>
	vi.mocked(snapshot).mock.calls.at(-1)![0] as unknown as Registered;
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ loadSymbolAtlas: vi.fn() }));

function renderGlossary(entries: GlossaryEntry[] = testGlossary(), error?: string): void {
	render(GlossaryPage, {
		data: { session: testSession(), entries, error },
		params: {}
	});
}

function manyEntries(count: number): GlossaryEntry[] {
	return Array.from({ length: count }, (_, position) =>
		testEntry(`entry-${position}`, position === 0 ? 'Tympanum' : `Term ${position}`)
	);
}

function entryLink(name: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('link', { name: new RegExp(`^${name}`) });
}

describe('glossary page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		localStorage.clear();
		sessionStorage.clear();
		await page.viewport(1280, 800);
	});

	it('lists the newest entries first without letters when sorted by the date of adding', async () => {
		renderGlossary([
			...manyEntries(GLOSSARY_INDEX_MIN_ENTRIES),
			testEntry('apse', 'Apsyda', { createdAt: '2026-11-05T10:00:00Z' })
		]);

		await page
			.getByRole('combobox', { name: m.glossary.sortLabel })
			.selectOptions(m.glossary.sorts.recent);

		await expect
			.poll(() =>
				page
					.getByRole('link', { name: /^(Apsyda|Tympanum|Term)/ })
					.elements()
					.map((link) => link.getAttribute('href'))
					.at(0)
			)
			.toBe('/atelier/glossary/apse');
		expect(page.getByRole('heading', { level: 2 }).elements()).toHaveLength(0);
		await expect
			.element(page.getByRole('navigation', { name: m.glossary.letters }))
			.not.toBeInTheDocument();
		expect(localStorage.getItem('study-atelier:glossary-sort')).toBe('recent');
	});

	it('opens in the order the learner picked last time', async () => {
		localStorage.setItem('study-atelier:glossary-sort', 'recent');
		renderGlossary();

		await expect
			.element(page.getByRole('combobox', { name: m.glossary.sortLabel }))
			.toHaveValue('recent');
		expect(page.getByRole('heading', { level: 2 }).elements()).toHaveLength(0);
	});

	it('keeps the letter of a group in view below the bar on desktop', async () => {
		renderGlossary();

		const letter = page.getByRole('heading', { level: 2, name: 'A' }).element();

		expect(getComputedStyle(letter).position).toBe('sticky');
	});

	it('starts the index of letters at the list on a phone, below the search field', async () => {
		await page.viewport(390, 844);
		renderGlossary(
			Array.from({ length: 26 }, (_, position) =>
				testEntry(`entry-${position}`, `${String.fromCharCode(65 + position)}rch`)
			)
		);
		const index = page.getByRole('navigation', { name: m.glossary.letters });

		await expect.element(index).toBeInTheDocument();
		const search = page.getByRole('searchbox').element().getBoundingClientRect();
		await expect
			.poll(() => index.element().getBoundingClientRect().top)
			.toBeGreaterThan(search.bottom);
	});

	it('shows the title, the lead and the add button in the tab', async () => {
		renderGlossary();

		await expect
			.element(page.getByRole('banner').getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.glossary.title);
		await expect.element(page.getByText(m.glossary.lead)).toBeVisible();
		await expect
			.element(page.getByRole('tabpanel').getByRole('link', { name: m.glossary.add }))
			.toHaveAttribute('href', '/atelier/glossary/new');
		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.glossary.add }))
			.not.toBeInTheDocument();
	});

	it('counts every term next to the title, whatever the filter shows', async () => {
		renderGlossary();

		await expect.element(page.getByText(m.glossary.count(5))).toBeVisible();

		await page.getByRole('button', { name: `${m.glossary.categoryNames.painting} 1` }).click();

		await expect.element(page.getByText(m.glossary.count(5))).toBeVisible();
	});

	it('puts the search field before the categories', async () => {
		renderGlossary(manyEntries(GLOSSARY_INDEX_MIN_ENTRIES));

		const search = page.getByRole('searchbox', { name: m.glossary.search }).element();
		const categories = page.getByRole('list', { name: m.glossary.categories }).element();

		expect(
			search.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	it('lists the entries in alphabetical order under their capital letters', async () => {
		renderGlossary();

		const letters = page.getByRole('heading', { level: 2 }).elements();

		expect(letters.map((letter) => letter.textContent)).toEqual(['A', 'C', 'F', 'Ł', 'T']);
		await expect.element(entryLink('Abacus')).toHaveAttribute('href', '/atelier/glossary/a-abacus');
		await expect.element(entryLink('Łuk')).toHaveAttribute('href', '/atelier/glossary/a-lukowy');
	});

	it('shows the category and the first sentence of the definition of every entry', async () => {
		renderGlossary();

		const link = entryLink('Fresco');

		await expect.element(link).toHaveTextContent(m.glossary.categoryNames.technique);
		await expect.element(link).toHaveTextContent('Fresco is a test definition.');
		await expect.element(link).not.toHaveTextContent('second sentence');
	});

	it('shows the six term categories with the number of entries and filters by the pressed ones', async () => {
		renderGlossary();

		const architecture = page.getByRole('button', {
			name: `${m.glossary.categoryNames.architecture} 3`
		});
		await expect.element(architecture).toHaveAttribute('aria-pressed', 'false');
		await expect
			.element(page.getByRole('button', { name: `${m.glossary.categoryNames.iconography} 0` }))
			.toBeVisible();
		expect(
			page.getByRole('button', { name: new RegExp(m.glossary.categoryNames.patron) }).elements()
		).toHaveLength(0);

		await architecture.click();

		await expect.element(architecture).toHaveAttribute('aria-pressed', 'true');
		await expect.element(entryLink('Tympanum')).toBeVisible();
		await expect.element(entryLink('Fresco')).not.toBeInTheDocument();

		await page.getByRole('button', { name: `${m.glossary.categoryNames.painting} 1` }).click();

		await expect.element(entryLink('Chiaroscuro')).toBeVisible();
		await expect.element(entryLink('Lorenzo Medici')).not.toBeInTheDocument();

		await architecture.click();
		await page.getByRole('button', { name: `${m.glossary.categoryNames.painting} 1` }).click();

		await expect.element(entryLink('Fresco')).toBeVisible();
	});

	it('offers "Bez kategorii" only when an entry has no category, and filters by it', async () => {
		renderGlossary([
			...testGlossary(),
			testEntry('a-kampanila', 'Kampanila', { category: null }),
			testEntry('f-none', 'Herkules', { kind: 'figure', category: null })
		]);

		const none = page.getByRole('button', { name: `${m.glossary.noCategory} 1` });
		await expect.element(entryLink('Kampanila')).not.toHaveTextContent(m.glossary.noCategory);
		await none.click();

		await expect.element(entryLink('Kampanila')).toBeVisible();
		await expect.element(entryLink('Tympanum')).not.toBeInTheDocument();
		await expect.element(entryLink('Herkules')).not.toBeInTheDocument();
	});

	it('offers no "Bez kategorii" when every entry has a category', async () => {
		renderGlossary();

		expect(
			page.getByRole('button', { name: new RegExp(m.glossary.noCategory) }).elements()
		).toHaveLength(0);
	});

	it('disables a category without entries', async () => {
		renderGlossary();

		await expect
			.element(page.getByRole('button', { name: `${m.glossary.categoryNames.sculpture} 0` }))
			.toBeDisabled();
	});

	it('shows the search field and the order however few entries there are', async () => {
		renderGlossary([testEntry('apse', 'Apsyda')]);

		await expect.element(page.getByRole('searchbox', { name: m.glossary.search })).toBeVisible();
		await expect
			.element(page.getByRole('combobox', { name: m.glossary.sortLabel }))
			.toBeInTheDocument();
	});

	it('searches by part of a name', async () => {
		renderGlossary(manyEntries(GLOSSARY_INDEX_MIN_ENTRIES));

		await userEvent.fill(page.getByRole('searchbox', { name: m.glossary.search }), 'tymp');

		await expect.element(entryLink('Tympanum')).toBeVisible();
		await expect.element(entryLink('Term 1')).not.toBeInTheDocument();

		await userEvent.fill(page.getByRole('searchbox', { name: m.glossary.search }), 'qqq');

		await expect.element(page.getByText(m.glossary.noResults('qqq'))).toBeVisible();
	});

	it('offers an index of letters from twenty entries and jumps to a letter', async () => {
		const entries = Array.from({ length: 26 * 3 }, (_, position) =>
			testEntry(`entry-${position}`, `${String.fromCharCode(65 + (position % 26))}rch ${position}`)
		);
		renderGlossary(entries);
		const index = page.getByRole('navigation', { name: m.glossary.letters });

		await expect
			.element(index.getByRole('button', { name: 'A', exact: true }))
			.toHaveAttribute('aria-current', 'true');
		await index.getByRole('button', { name: 'K', exact: true }).click();

		await expect
			.poll(() => document.getElementById('letter-K')?.getBoundingClientRect().top ?? 1000)
			.toBeLessThan(120);
		await expect
			.element(index.getByRole('button', { name: 'K', exact: true }))
			.toHaveAttribute('aria-current', 'true');
	});

	it('offers no index of letters below twenty entries', async () => {
		renderGlossary(manyEntries(GLOSSARY_INDEX_MIN_ENTRIES - 1));

		await expect.element(entryLink('Tympanum')).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: m.glossary.letters }))
			.not.toBeInTheDocument();
	});

	it('keeps in the index only the letters the search leaves', async () => {
		renderGlossary([...manyEntries(GLOSSARY_INDEX_MIN_ENTRIES), testEntry('apse', 'Apsyda')]);

		await page.getByRole('searchbox').fill('a');
		const index = page.getByRole('navigation', { name: m.glossary.letters });

		await expect.element(index.getByRole('button', { name: 'A', exact: true })).toBeInTheDocument();
		await expect.element(index.getByRole('button', { name: 'T', exact: true })).toBeInTheDocument();
		await page.getByRole('searchbox').fill('aps');
		await expect.element(index).not.toBeInTheDocument();
	});

	it('says the glossary is empty and offers no categories', async () => {
		renderGlossary([]);

		await expect.element(page.getByText(m.glossary.empty)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.glossary.addFirst }))
			.toHaveAttribute('href', '/atelier/glossary/new');
		await expect.element(page.getByText(m.glossary.count(0))).not.toBeInTheDocument();
		expect(
			page.getByRole('button', { name: m.glossary.categoryNames.architecture }).elements()
		).toHaveLength(0);
	});

	it('shows a load error without the add button', async () => {
		renderGlossary([], m.common.unexpectedError);

		await expect.element(page.getByText(m.glossary.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.common.unexpectedError)).toBeVisible();
		await expect.element(page.getByRole('link', { name: m.glossary.add })).not.toBeInTheDocument();
	});

	it('shows the toast of a deleted entry once and clears it from the history state', async () => {
		navigation.state = { glossaryMessage: m.glossary.view.deleted('Tympanum') };
		renderGlossary();

		await expect.element(page.getByText(m.glossary.view.deleted('Tympanum'))).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/glossary', {
			state: {},
			shallow: true,
			replace: true
		});
	});

	it('keeps the search and the chosen categories when the learner comes back', async () => {
		const first = await render(GlossaryPage, {
			data: {
				session: testSession(),
				entries: manyEntries(GLOSSARY_INDEX_MIN_ENTRIES)
			},
			params: {}
		});
		await userEvent.fill(page.getByRole('searchbox', { name: m.glossary.search }), 'Tymp');
		const saved = registered().capture();
		first.unmount();

		await render(GlossaryPage, {
			data: {
				session: testSession(),
				entries: manyEntries(GLOSSARY_INDEX_MIN_ENTRIES)
			},
			params: {}
		});
		registered().restore(saved);

		await expect
			.element(page.getByRole('searchbox', { name: m.glossary.search }))
			.toHaveValue('Tymp');
		await expect.element(entryLink('Term 1')).not.toBeInTheDocument();
		expect(saved).toEqual({
			tab: 'terms',
			query: 'Tymp',
			figureQuery: '',
			symbolQuery: '',
			chosen: [],
			figureChosen: [],
			scroll: 0
		});
	});

	it('scrolls back to the saved place after the restored filter moved the page', async () => {
		const entries = Array.from({ length: 80 }, (_, position) =>
			testEntry(`entry-${position}`, `Term ${String(position).padStart(2, '0')}`, {
				category: position % 2 === 0 ? 'architecture' : 'painting'
			})
		);
		const first = await render(GlossaryPage, {
			data: { session: testSession(), entries },
			params: {}
		});
		await page.getByRole('button', { name: `${m.glossary.categoryNames.painting} 40` }).click();
		await expect.element(entryLink('Term 00')).not.toBeInTheDocument();
		const place = Math.round((document.documentElement.scrollHeight - window.innerHeight) / 2);
		window.scrollTo({ top: place, behavior: 'instant' });
		const saved = registered().capture();
		first.unmount();

		await render(GlossaryPage, {
			data: { session: testSession(), entries },
			params: {}
		});
		window.scrollTo({ top: place, behavior: 'instant' });
		registered().restore(saved);
		window.scrollTo({ top: place / 2, behavior: 'instant' });

		await expect.element(entryLink('Term 00')).not.toBeInTheDocument();
		await expect.poll(() => window.scrollY).toBe(place);
		expect(saved).toEqual({
			tab: 'terms',
			query: '',
			figureQuery: '',
			symbolQuery: '',
			chosen: ['painting'],
			figureChosen: [],
			scroll: place
		});
	});

	describe('figures tab', () => {
		const figures = (): GlossaryEntry[] => [
			...testGlossary(),
			testEntry('f-zeus', 'Zeus', { category: 'myth' }),
			testEntry('f-ramses', 'Ramzes II', { category: 'ruler' })
		];

		async function openFigures(entries: GlossaryEntry[] = figures()): Promise<void> {
			renderGlossary(entries);
			await page.getByRole('tab', { name: m.glossary.tabs.figures }).click();
		}

		it('puts the tab between terms and symbols', async () => {
			renderGlossary();

			expect(
				page
					.getByRole('tab')
					.elements()
					.map((tab) => tab.textContent?.trim())
			).toEqual([m.glossary.tabs.terms, m.glossary.tabs.figures, m.glossary.tabs.symbols]);
		});

		it('lists only the figures under their letters, with the figure categories and their count', async () => {
			await openFigures();

			expect(
				page
					.getByRole('heading', { level: 2 })
					.elements()
					.map((letter) => letter.textContent)
			).toEqual(['L', 'R', 'Z']);
			await expect.element(entryLink('Zeus')).toHaveAttribute('href', '/atelier/glossary/f-zeus');
			await expect.element(entryLink('Tympanum')).not.toBeInTheDocument();
			await expect.element(page.getByText(m.glossary.figures.count(3))).toBeVisible();
			await expect
				.element(page.getByRole('button', { name: `${m.glossary.categoryNames.myth} 1` }))
				.toBeVisible();
			await expect
				.element(page.getByRole('button', { name: `${m.glossary.categoryNames.artist} 0` }))
				.toBeDisabled();
			expect(
				page
					.getByRole('button', { name: new RegExp(m.glossary.categoryNames.architecture) })
					.elements()
			).toHaveLength(0);
		});

		it('filters and searches the figures apart from the terms', async () => {
			await openFigures();

			await page.getByRole('button', { name: `${m.glossary.categoryNames.ruler} 1` }).click();
			await expect.element(entryLink('Ramzes II')).toBeVisible();
			await expect.element(entryLink('Zeus')).not.toBeInTheDocument();

			await userEvent.fill(page.getByRole('searchbox', { name: m.glossary.figures.search }), 'qqq');
			await expect.element(page.getByText(m.glossary.noResults('qqq'))).toBeVisible();

			await page.getByRole('tab', { name: m.glossary.tabs.terms }).click();
			await expect
				.element(page.getByRole('searchbox', { name: m.glossary.search }))
				.toHaveValue('');
			await expect.element(entryLink('Tympanum')).toBeVisible();
		});

		it('adds a figure through the form of a figure', async () => {
			await openFigures();

			await expect
				.element(page.getByRole('tabpanel').getByRole('link', { name: m.glossary.figures.add }))
				.toHaveAttribute('href', '/atelier/glossary/new?kind=figure');
		});

		it('says there is no figure yet and offers to add the first one', async () => {
			await openFigures(testGlossary().filter((entry) => entry.category !== 'patron'));

			await expect.element(page.getByText(m.glossary.figures.emptyTitle)).toBeVisible();
			await expect.element(page.getByText(m.glossary.figures.empty)).toBeVisible();
			await expect
				.element(page.getByRole('link', { name: m.glossary.figures.addFirst }))
				.toHaveAttribute('href', '/atelier/glossary/new?kind=figure');
		});

		it('counts one figure in the singular', () => {
			expect(m.glossary.figures.count(1)).toBe('1 postać');
			expect(m.glossary.figures.count(2)).toBe('2 postaci');
			expect(m.glossary.figures.count(5)).toBe('5 postaci');
		});

		it('draws a divider between the entries of one letter only', async () => {
			await openFigures([
				testEntry('f-zeus', 'Zeus', { category: 'myth' }),
				testEntry('f-zefir', 'Zefir', { category: 'myth' }),
				testEntry('f-ramses', 'Ramzes II', { category: 'ruler' })
			]);

			const rows = [...document.querySelectorAll<HTMLElement>('.group li')];
			const dividers = rows.map((row) => getComputedStyle(row, '::before').content !== 'none');
			expect(dividers).toEqual([false, false, true]);
		});
	});

	describe('symbols tab', () => {
		const symbols: AtlasSymbol[] = [
			{
				id: 'skull',
				name: 'Czaszka',
				createdAt: '2026-11-01T10:00:00Z',
				meaningCount: 2,
				pinCount: 3
			},
			{
				id: 'lily',
				name: 'Lilia',
				createdAt: '2026-11-10T10:00:00Z',
				meaningCount: 0,
				pinCount: 1
			}
		];

		function renderSymbols(shown: AtlasSymbol[] = symbols, error?: string): void {
			vi.mocked(loadSymbolAtlas).mockResolvedValue({ symbols: shown, error });
			render(GlossaryPage, {
				data: { session: testSession(), entries: testGlossary() },
				params: {}
			});
		}

		async function openSymbols(): Promise<void> {
			await page.getByRole('tab', { name: m.glossary.tabs.symbols }).click();
		}

		it('shows the atlas as lenses with the counts', async () => {
			renderSymbols();
			await openSymbols();

			const skull = page.getByRole('link', { name: /Czaszka/ });
			await expect.element(skull).toHaveAttribute('href', '/atelier/glossary/symbols/skull');
			await expect
				.element(skull)
				.toHaveTextContent(`${m.symbols.details(3)} · ${m.symbols.meanings(2)}`);
			await expect.element(page.getByText(m.symbols.count(2))).toBeVisible();
			await expect
				.element(page.getByRole('tabpanel').getByRole('link', { name: m.symbols.add }))
				.toHaveAttribute('href', '/atelier/glossary/symbols/new');
			await expect
				.element(page.getByRole('link', { name: m.glossary.add }))
				.not.toBeInTheDocument();
		});

		it('finds a symbol by name and sorts by the number of details', async () => {
			renderSymbols();
			await openSymbols();

			await page
				.getByRole('combobox', { name: m.symbols.sortLabel })
				.selectOptions(m.symbols.sorts.recent);
			const names = (): string[] =>
				[...document.querySelectorAll('.grid .name')].map((name) => name.textContent ?? '');
			expect(names()).toEqual(['Lilia', 'Czaszka']);
			await page
				.getByRole('combobox', { name: m.symbols.sortLabel })
				.selectOptions(m.symbols.sorts.details);
			expect(names()).toEqual(['Czaszka', 'Lilia']);

			await userEvent.fill(page.getByRole('searchbox', { name: m.symbols.search }), 'lil');
			await expect.element(page.getByRole('link', { name: /Czaszka/ })).not.toBeInTheDocument();
			await userEvent.fill(page.getByRole('searchbox', { name: m.symbols.search }), 'róża');
			await expect.element(page.getByText(m.symbols.noResults('róża'))).toBeVisible();
		});

		it('invites to add the first symbol to an empty atlas', async () => {
			renderSymbols([]);
			await openSymbols();

			await expect.element(page.getByText(m.symbols.emptyTitle)).toBeVisible();
			await expect
				.element(page.getByRole('link', { name: m.symbols.addFirst }))
				.toHaveAttribute('href', '/atelier/glossary/symbols/new');
		});

		it('says when the atlas did not load', async () => {
			renderSymbols([], 'Offline.');
			await openSymbols();

			await expect.element(page.getByText(m.symbols.loadErrorTitle)).toBeVisible();
			await expect.element(page.getByText('Offline.')).toBeVisible();
		});

		it('loads the atlas only when the tab is opened', async () => {
			vi.mocked(loadSymbolAtlas).mockClear();
			vi.mocked(loadSymbolAtlas).mockResolvedValue({ symbols });
			renderGlossary();

			await expect.element(page.getByRole('tab', { name: m.glossary.tabs.symbols })).toBeVisible();
			expect(loadSymbolAtlas).not.toHaveBeenCalled();

			await openSymbols();
			await expect.element(page.getByRole('link', { name: /Czaszka/ })).toBeVisible();
			expect(loadSymbolAtlas).toHaveBeenCalledTimes(1);
		});

		it('opens on the tab the learner left', async () => {
			sessionStorage.setItem('study-atelier:glossary-tab', 'symbols');
			renderSymbols();

			await expect.element(page.getByRole('link', { name: /Czaszka/ })).toBeVisible();
		});
	});
});
