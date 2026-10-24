import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/index.ts';
import { GLOSSARY_SEARCH_MIN_ENTRIES } from '#lib/glossary/glossary.ts';
import type { GlossaryEntry } from '#lib/glossary/types.ts';
import { testSession } from '#lib/testing/auth.ts';
import { testEntry, testGlossary } from '#lib/testing/glossary.ts';
import GlossaryPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/glossary'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

function renderGlossary(entries: GlossaryEntry[] = testGlossary(), error?: string): void {
	render(GlossaryPage, { data: { session: testSession(), entries, error }, params: {} });
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
		await page.viewport(1280, 800);
	});

	it('shows the title, the lead and the add button as the one primary action', async () => {
		renderGlossary();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.glossary.title);
		await expect.element(page.getByText(m.glossary.lead)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.glossary.add }))
			.toHaveAttribute('href', '/atelier/glossary/new');
	});

	it('counts every entry next to the title, whatever the filter shows', async () => {
		renderGlossary();

		await expect.element(page.getByText(m.glossary.count(6))).toBeVisible();

		await page.getByRole('button', { name: `${m.glossary.categoryNames.painting} 1` }).click();

		await expect.element(page.getByText(m.glossary.count(6))).toBeVisible();
	});

	it('puts the search field before the categories', async () => {
		renderGlossary(manyEntries(GLOSSARY_SEARCH_MIN_ENTRIES));

		const search = page.getByRole('searchbox', { name: m.glossary.search }).element();
		const categories = page.getByRole('list', { name: m.glossary.categories }).element();

		expect(
			search.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	});

	it('lists the entries in alphabetical order under their capital letters', async () => {
		renderGlossary();

		const letters = page.getByRole('heading', { level: 2 }).elements();

		expect(letters.map((letter) => letter.textContent)).toEqual(['A', 'C', 'F', 'L', 'Ł', 'T']);
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

	it('shows the six categories with the number of entries and filters by the pressed ones', async () => {
		renderGlossary();

		const architecture = page.getByRole('button', {
			name: `${m.glossary.categoryNames.architecture} 3`
		});
		await expect.element(architecture).toHaveAttribute('aria-pressed', 'false');
		await expect
			.element(page.getByRole('button', { name: `${m.glossary.categoryNames.person} 1` }))
			.toBeVisible();

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

	it('disables a category without entries', async () => {
		renderGlossary();

		await expect
			.element(page.getByRole('button', { name: `${m.glossary.categoryNames.sculpture} 0` }))
			.toBeDisabled();
	});

	it('shows a search field only from twenty entries and filters by name', async () => {
		renderGlossary(manyEntries(GLOSSARY_SEARCH_MIN_ENTRIES - 1));
		expect(page.getByRole('searchbox').elements()).toHaveLength(0);
	});

	it('searches by part of a name once there are twenty entries', async () => {
		renderGlossary(manyEntries(GLOSSARY_SEARCH_MIN_ENTRIES));

		await userEvent.fill(page.getByRole('searchbox', { name: m.glossary.search }), 'tymp');

		await expect.element(entryLink('Tympanum')).toBeVisible();
		await expect.element(entryLink('Term 1')).not.toBeInTheDocument();

		await userEvent.fill(page.getByRole('searchbox', { name: m.glossary.search }), 'qqq');

		await expect.element(page.getByText(m.glossary.noResults('qqq'))).toBeVisible();
	});

	it('says the glossary is empty and offers no categories', async () => {
		renderGlossary([]);

		await expect.element(page.getByText(m.glossary.empty)).toBeVisible();
		await expect.element(page.getByText(m.glossary.count(0))).not.toBeInTheDocument();
		expect(
			page.getByRole('button', { name: m.glossary.categoryNames.person }).elements()
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
			data: { session: testSession(), entries: manyEntries(GLOSSARY_SEARCH_MIN_ENTRIES) },
			params: {}
		});
		await userEvent.fill(page.getByRole('searchbox', { name: m.glossary.search }), 'Tymp');
		const saved = first.component.snapshot.capture();
		first.unmount();

		const second = await render(GlossaryPage, {
			data: { session: testSession(), entries: manyEntries(GLOSSARY_SEARCH_MIN_ENTRIES) },
			params: {}
		});
		second.component.snapshot.restore(saved);

		await expect
			.element(page.getByRole('searchbox', { name: m.glossary.search }))
			.toHaveValue('Tymp');
		await expect.element(entryLink('Term 1')).not.toBeInTheDocument();
		expect(saved).toEqual({ query: 'Tymp', chosen: [], scroll: 0 });
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
		const saved = first.component.snapshot.capture();
		first.unmount();

		const second = await render(GlossaryPage, {
			data: { session: testSession(), entries },
			params: {}
		});
		window.scrollTo({ top: place, behavior: 'instant' });
		second.component.snapshot.restore(saved);
		window.scrollTo({ top: place / 2, behavior: 'instant' });

		await expect.element(entryLink('Term 00')).not.toBeInTheDocument();
		await expect.poll(() => window.scrollY).toBe(place);
		expect(saved).toEqual({ query: '', chosen: ['painting'], scroll: place });
	});
});
