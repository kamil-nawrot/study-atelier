import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { saveGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
import { searchArticles } from '#lib/glossary/wikipedia/wikipedia.ts';
import { fetchForms } from '#lib/glossary/wiktionary/wiktionary.ts';
import type { GlossaryEntry } from '#lib/glossary/types.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import { testArticle, testEntry, testGlossary } from '#lib/testing/glossary/glossary.ts';
import EditGlossaryPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ saveGlossaryEntry: vi.fn() }));
vi.mock('#lib/glossary/wikipedia/wikipedia.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/glossary/wikipedia/wikipedia.ts')>()),
	searchArticles: vi.fn()
}));
vi.mock('#lib/glossary/wiktionary/wiktionary.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/glossary/wiktionary/wiktionary.ts')>()),
	fetchForms: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const entries = testGlossary();
const tympanum = entries[0];

function renderEdit(
	entry: GlossaryEntry | null = tympanum,
	failure: { error?: string; notFound?: boolean } = {}
): void {
	render(EditGlossaryPage, {
		data: {
			session: testSession(),
			entry: entry ?? undefined,
			entries,
			index: testCardIndex(),
			...failure
		},
		params: { id: entry?.id ?? 'unknown' }
	});
}

function nameField(): ReturnType<typeof page.getByRole> {
	return page.getByLabelText(m.glossary.form.name);
}

async function addSynonym(word: string): Promise<void> {
	await page.getByRole('combobox', { name: m.glossary.form.synonyms }).fill(word);
	await userEvent.keyboard('{Enter}');
	await vi.advanceTimersByTimeAsync(0);
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.glossary.form.save, exact: true });
}

describe('edit glossary entry page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
		await page.viewport(1280, 800);
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ id: tympanum.id });
		vi.mocked(searchArticles).mockResolvedValue([]);
		vi.mocked(fetchForms).mockResolvedValue([]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('titles the page and fills the form from the entry', async () => {
		renderEdit();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.glossary.form.editTitle);
		await expect.element(nameField()).toHaveValue('Tympanum');
		await expect
			.element(page.getByRole('radio', { name: m.glossary.categoryNames.architecture }))
			.toBeChecked();
		await expect
			.element(page.getByLabelText(m.glossary.form.definition))
			.toHaveValue(tympanum.definition);
		await expect.element(page.getByText('tympan', { exact: true })).toBeVisible();
		await expect.element(page.getByText(/Na podstawie: Wikipedia, „Tympanum”/)).toBeVisible();
		await expect
			.element(page.getByRole('checkbox', { name: m.glossary.form.sortByOther }))
			.not.toBeChecked();
		await expect
			.element(page.getByRole('link', { name: m.glossary.form.cancel }))
			.toHaveAttribute('href', `/atelier/glossary/${tympanum.id}`);
	});

	it('collapses the saved forms behind their number and shows them on request', async () => {
		renderEdit();

		await expect.element(page.getByText(m.glossary.form.formsCount(2))).toBeVisible();
		await expect.element(page.getByText('tympana', { exact: true })).not.toBeInTheDocument();

		await page.getByRole('button', { name: m.glossary.form.showForms, exact: true }).click();

		await expect.element(page.getByText('tympana', { exact: true })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.glossary.form.hideForms, exact: true }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('fetches the forms of an older entry only on request', async () => {
		vi.mocked(fetchForms).mockResolvedValue(['fresku', 'freski']);
		renderEdit(testEntry('a-fresco', 'Fresk', { category: 'technique' }));
		await vi.advanceTimersByTimeAsync(1000);

		expect(fetchForms).not.toHaveBeenCalled();

		await page.getByRole('button', { name: m.glossary.form.formsFetch }).click();

		expect(fetchForms).toHaveBeenCalledWith('Fresk');
		await expect.element(page.getByText(m.glossary.form.formsCount(2))).toBeVisible();
	});

	it('offers to fetch the forms again after the name changes and replaces them', async () => {
		vi.mocked(fetchForms).mockResolvedValue(['tympanu']);
		renderEdit();

		expect(
			page.getByRole('button', { name: m.glossary.form.formsRefetch }).elements()
		).toHaveLength(0);

		await nameField().fill('Tympan');
		await page.getByRole('button', { name: m.glossary.form.formsRefetch }).click();

		expect(fetchForms).toHaveBeenCalledWith('Tympan');
		await expect.element(page.getByText(m.glossary.form.formsCount(1))).toBeVisible();
	});

	it('adds the forms of a new synonym and takes them away with it', async () => {
		vi.mocked(fetchForms).mockResolvedValue(['malowidła', 'malowidłem']);
		renderEdit(testEntry('a-fresco', 'Fresk', { category: 'technique', forms: ['fresku'] }));

		await addSynonym('malowidło');

		expect(fetchForms).toHaveBeenCalledWith('malowidło');
		await expect.element(page.getByText(m.glossary.form.formsCount(3))).toBeVisible();

		await page.getByRole('button', { name: m.ui.valueField.remove('malowidło') }).click();

		await expect.element(page.getByText(m.glossary.form.formsCount(1))).toBeVisible();
	});

	it('says when Wiktionary has no forms of a synonym', async () => {
		renderEdit(testEntry('a-fresco', 'Fresk', { category: 'technique', forms: ['fresku'] }));

		await addSynonym('al fresco');

		await expect
			.element(page.getByText(m.glossary.form.synonymFormsNone('al fresco')))
			.toBeVisible();
	});

	it('does not look up the synonyms of a person', async () => {
		renderEdit(testEntry('a-lorenzo', 'Lorenzo Medici', { category: 'person' }));

		await addSynonym('Wspaniały');

		expect(fetchForms).not.toHaveBeenCalled();
	});

	it('takes at most three synonyms', async () => {
		renderEdit(testEntry('a-fresco', 'Fresk', { category: 'technique' }));

		await addSynonym('jeden');
		await addSynonym('dwa');
		await addSynonym('trzy');

		await expect.element(page.getByText(m.glossary.form.synonymsFull)).toBeVisible();
		await expect
			.element(page.getByRole('combobox', { name: m.glossary.form.synonyms }))
			.not.toBeInTheDocument();
	});

	it('fetches the forms of the name and of every synonym again', async () => {
		vi.mocked(fetchForms).mockImplementation(async (word) => [`${word}-forma`]);
		renderEdit();

		await nameField().fill('Tympanon');
		await page.getByRole('button', { name: m.glossary.form.formsRefetch }).click();

		expect(fetchForms).toHaveBeenCalledWith('Tympanon');
		expect(fetchForms).toHaveBeenCalledWith('tympan');
		await expect.element(page.getByText(m.glossary.form.formsCount(2))).toBeVisible();
	});

	it('shows the sort name of an entry that has one', async () => {
		renderEdit(testEntry('a-lorenzo', 'Lorenzo Medici', { sortName: 'Medici, Lorenzo' }));

		await expect
			.element(page.getByRole('checkbox', { name: m.glossary.form.sortByOther }))
			.toBeChecked();
		await expect
			.element(page.getByRole('textbox', { name: m.glossary.form.sortName }))
			.toHaveValue('Medici, Lorenzo');
	});

	it('does not search Wikipedia again for an entry that already has a definition', async () => {
		renderEdit();
		await vi.advanceTimersByTimeAsync(1000);

		expect(searchArticles).not.toHaveBeenCalled();
	});

	it('saves a changed name over the same entry and opens its page with a toast', async () => {
		renderEdit();

		await nameField().fill('Tympanon');
		await saveButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Tympanon', forms: ['tympana', 'tympanum’s'] }),
			tympanum.id
		);
		expect(goto).toHaveBeenCalledWith(`/atelier/glossary/${tympanum.id}`, {
			replace: true,
			refreshAll: true,
			state: { glossaryMessage: m.glossary.view.saved('Tympanon') }
		});
	});

	it('does not count the entry itself as a taken name', async () => {
		renderEdit();

		await nameField().fill('tympanum');
		await saveButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalled();
	});

	it('says the name is taken when it matches another entry', async () => {
		renderEdit();

		await nameField().fill('abacus');
		await saveButton().click();

		await expect.element(page.getByText(m.glossary.form.nameTaken('abacus'))).toBeVisible();
		expect(saveGlossaryEntry).not.toHaveBeenCalled();
	});

	it('asks before replacing a stored definition with another article, since it may have been edited', async () => {
		vi.mocked(searchArticles).mockResolvedValue([
			testArticle('Tympanum', 'Tympanum, the text of Wikipedia.'),
			testArticle('Tympanon', 'Tympanon, another article.')
		]);
		renderEdit();

		await page.getByRole('button', { name: m.glossary.form.pickArticle }).click();
		await expect.element(page.getByRole('radio', { name: /^Tympanum/ })).toBeChecked();
		await page.getByRole('radio', { name: /^Tympanon/ }).click();
		await page.getByRole('button', { name: m.glossary.articles.use }).click();

		await expect
			.element(page.getByRole('alertdialog', { name: m.glossary.replaceConfirm.title }))
			.toBeVisible();
		await page.getByRole('button', { name: m.glossary.replaceConfirm.replace }).click();

		await expect
			.element(page.getByLabelText(m.glossary.form.definition))
			.toHaveValue('Tympanon, another article.');
		expect(searchArticles).toHaveBeenCalledWith('Tympanum', 'architecture');
	});

	it('says in the article picker that Wikipedia has nothing', async () => {
		renderEdit();

		await page.getByRole('button', { name: m.glossary.form.pickArticle }).click();

		await expect
			.element(page.getByRole('dialog', { name: m.glossary.articles.title }))
			.toBeVisible();
		await expect.element(page.getByText(m.glossary.form.definitionNone).last()).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.glossary.articles.use }))
			.toBeDisabled();
	});

	it('says in the article picker that Wikipedia did not answer', async () => {
		vi.mocked(searchArticles).mockRejectedValue(new Error('offline'));
		renderEdit();

		await page.getByRole('button', { name: m.glossary.form.pickArticle }).click();

		await expect.element(page.getByText(m.glossary.form.definitionFailed).last()).toBeVisible();
	});

	it('says the entry does not exist', async () => {
		renderEdit(null, { notFound: true });

		await expect.element(page.getByText(m.glossary.view.notFound)).toBeVisible();
		expect(page.getByLabelText(m.glossary.form.name).elements()).toHaveLength(0);
	});

	it('writes the new definition of an entry that had none and searches for it', async () => {
		const bare = testEntry('b-bare', 'Bare', { definition: '' });
		vi.mocked(searchArticles).mockResolvedValue([testArticle('Bare', 'Bare is found.')]);
		renderEdit(bare);

		await vi.advanceTimersByTimeAsync(700);

		await expect
			.element(page.getByLabelText(m.glossary.form.definition))
			.toHaveValue('Bare is found.');
	});
});
