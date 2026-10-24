import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { beforeNavigate, goto } from '$app/navigation';
import { m } from '#lib/i18n/index.ts';
import { saveGlossaryEntry } from '#lib/glossary/glossary-data.ts';
import { searchArticles } from '#lib/glossary/wikipedia.ts';
import { fetchForms } from '#lib/glossary/wiktionary.ts';
import type { WikipediaArticle } from '#lib/glossary/types.ts';
import { autoFetch } from '#lib/profile/auto-fetch.svelte.ts';
import { testSession } from '#lib/testing/auth.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { testArticle, testEntry } from '#lib/testing/glossary.ts';
import NewGlossaryPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data.ts', () => ({ saveGlossaryEntry: vi.fn() }));
vi.mock('#lib/glossary/wikipedia.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/glossary/wikipedia.ts')>()),
	searchArticles: vi.fn()
}));
vi.mock('#lib/glossary/wiktionary.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/glossary/wiktionary.ts')>()),
	fetchForms: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const NAWA = testArticle('Nawa', 'Nawa to podłużna część wnętrza kościoła.');
const TRANSEPT = testArticle('Transept', 'Transept to nawa poprzeczna.');

function renderNew(error?: string): void {
	render(NewGlossaryPage, {
		data: {
			session: testSession(),
			entries: [testEntry('a-tympanum', 'Tympanum')],
			index: testCardIndex(),
			error
		},
		params: {}
	});
}

function nameField(): ReturnType<typeof page.getByRole> {
	return page.getByLabelText(m.glossary.form.name);
}

function definitionField(): ReturnType<typeof page.getByRole> {
	return page.getByLabelText(m.glossary.form.definition);
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.glossary.form.save, exact: true });
}

function category(name: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('radio', { name });
}

async function fillAndSearch(
	articles: WikipediaArticle[] = [NAWA, TRANSEPT],
	name = 'nawa'
): Promise<void> {
	vi.mocked(searchArticles).mockResolvedValue(articles);
	await nameField().fill(name);
	await category(m.glossary.categoryNames.architecture).click();
	await vi.advanceTimersByTimeAsync(700);
}

describe('new glossary entry page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
		await page.viewport(1280, 800);
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ id: 'new-id' });
		vi.mocked(searchArticles).mockResolvedValue([]);
		vi.mocked(fetchForms).mockResolvedValue([]);
	});

	afterEach(() => {
		vi.useRealTimers();
		autoFetch.definition = true;
		autoFetch.forms = true;
	});

	it('titles the page and the form and lays out the fields', async () => {
		renderNew();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.glossary.form.newTitle);
		await expect
			.element(nameField())
			.toHaveAttribute('placeholder', m.glossary.form.namePlaceholder);
		for (const name of Object.values(m.glossary.categoryNames)) {
			await expect.element(category(name)).toBeInTheDocument();
		}
		await expect
			.element(definitionField())
			.toHaveAttribute('placeholder', m.glossary.form.definitionPending);
		await expect.element(page.getByText(m.glossary.form.formsHint)).toBeVisible();
		await expect.element(page.getByText(m.glossary.form.synonymsHint)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.glossary.form.cancel }))
			.toHaveAttribute('href', '/atelier/glossary');
	});

	it('requires a name and a category', async () => {
		renderNew();

		await saveButton().click();

		await expect.element(page.getByText(m.valueForm.nameRequired)).toBeVisible();
		await expect.element(page.getByText(m.glossary.form.categoryRequired)).toBeVisible();
		expect(saveGlossaryEntry).not.toHaveBeenCalled();
	});

	it('says the name is taken, ignoring letter case and diacritics', async () => {
		renderNew();

		await nameField().fill('TYMPANUM');
		await category(m.glossary.categoryNames.general).click();
		await saveButton().click();

		await expect.element(page.getByText(m.glossary.form.nameTaken('TYMPANUM'))).toBeVisible();
		expect(saveGlossaryEntry).not.toHaveBeenCalled();
	});

	it('says the name is taken when the database refuses it', async () => {
		renderNew();
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ nameTaken: true });

		await nameField().fill('Sfumato');
		await category(m.glossary.categoryNames.technique).click();
		await saveButton().click();

		await expect.element(page.getByText(m.glossary.form.nameTaken('Sfumato'))).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});

	it('shows a failed save in an alert at the top of the form', async () => {
		renderNew();
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ error: m.glossary.errors.network });

		await nameField().fill('Sfumato');
		await category(m.glossary.categoryNames.technique).click();
		await saveButton().click();

		await expect.element(page.getByText(m.glossary.form.errorTitle)).toBeVisible();
		await expect.element(page.getByText(m.glossary.errors.network)).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});

	it('searches Wikipedia once the name and the category are set and fills the definition with its source', async () => {
		renderNew();

		await fillAndSearch();

		expect(searchArticles).toHaveBeenCalledTimes(1);
		expect(searchArticles).toHaveBeenCalledWith('nawa', 'architecture');
		await expect.element(definitionField()).toHaveValue(NAWA.extract);
		await expect
			.element(page.getByText(/Na podstawie: Wikipedia, „Nawa”, CC BY-SA 4.0/))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.glossary.form.pickArticle }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.glossary.form.removeSource }))
			.toBeVisible();
	});

	it('does not search Wikipedia by itself when the learner switched it off, but does on request', async () => {
		autoFetch.definition = false;
		renderNew();

		await fillAndSearch([NAWA]);

		expect(searchArticles).not.toHaveBeenCalled();
		await expect.element(definitionField()).toHaveValue('');
		await page.getByRole('button', { name: m.glossary.form.searchDefinition }).click();
		await vi.advanceTimersByTimeAsync(0);

		expect(searchArticles).toHaveBeenCalledWith('nawa', 'architecture');
		await expect.element(definitionField()).toHaveValue(NAWA.extract);
	});

	it('does not ask Wiktionary by itself when the learner switched it off, but does on request', async () => {
		autoFetch.forms = false;
		vi.mocked(fetchForms).mockResolvedValue(['nawy']);
		renderNew();

		await fillAndSearch([NAWA]);

		expect(fetchForms).not.toHaveBeenCalled();
		await page.getByRole('button', { name: m.glossary.form.formsFetch }).click();
		await vi.advanceTimersByTimeAsync(0);

		expect(fetchForms).toHaveBeenCalledWith('nawa');
		await expect.element(page.getByText(m.glossary.form.formsCount(1))).toBeVisible();
	});

	it('does not ask Wiktionary for the forms of a synonym when the learner switched it off', async () => {
		autoFetch.forms = false;
		renderNew();
		await fillAndSearch([NAWA]);

		await page.getByRole('combobox', { name: m.glossary.form.synonyms }).fill('korpus');
		await page.getByRole('option', { name: /korpus/ }).click();
		await vi.advanceTimersByTimeAsync(700);

		expect(fetchForms).not.toHaveBeenCalled();
	});

	it('waits for the learner to stop typing before it searches', async () => {
		renderNew();
		vi.mocked(searchArticles).mockResolvedValue([NAWA]);

		await category(m.glossary.categoryNames.architecture).click();
		await nameField().fill('na');
		await vi.advanceTimersByTimeAsync(300);
		await nameField().fill('nawa');
		await vi.advanceTimersByTimeAsync(300);

		expect(searchArticles).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(400);

		expect(searchArticles).toHaveBeenCalledTimes(1);
		expect(searchArticles).toHaveBeenCalledWith('nawa', 'architecture');
	});

	it('says it is searching while it waits for Wikipedia', async () => {
		renderNew();
		vi.mocked(searchArticles).mockReturnValue(new Promise(() => {}));

		await nameField().fill('nawa');
		await category(m.glossary.categoryNames.architecture).click();
		await vi.advanceTimersByTimeAsync(700);

		await expect
			.element(definitionField())
			.toHaveAttribute('placeholder', m.glossary.form.definitionSearching);
	});

	it('searches again for the new name while the definition is still the fetched one', async () => {
		renderNew();
		await fillAndSearch([NAWA]);

		vi.mocked(searchArticles).mockResolvedValue([
			testArticle('Apsyda', 'Apsyda to półkolista część.')
		]);
		await nameField().fill('apsyda');
		await vi.advanceTimersByTimeAsync(700);

		await expect.element(definitionField()).toHaveValue('Apsyda to półkolista część.');
		await expect.element(page.getByText(/„Apsyda”/)).toBeVisible();
	});

	it('leaves a definition the learner wrote alone', async () => {
		renderNew();
		vi.mocked(searchArticles).mockResolvedValue([NAWA]);

		await definitionField().fill('My own words.');
		await nameField().fill('nawa');
		await category(m.glossary.categoryNames.architecture).click();
		await vi.advanceTimersByTimeAsync(700);

		expect(searchArticles).not.toHaveBeenCalled();
		await expect.element(definitionField()).toHaveValue('My own words.');
		expect(page.getByRole('button', { name: m.glossary.form.pickArticle }).elements()).toHaveLength(
			0
		);
	});

	it('says Wikipedia does not know the word and clears a fetched definition that no longer fits', async () => {
		renderNew();
		await fillAndSearch([NAWA]);

		vi.mocked(searchArticles).mockResolvedValue([]);
		await nameField().fill('xyzzy');
		await vi.advanceTimersByTimeAsync(700);

		await expect.element(page.getByText(m.glossary.form.definitionNone)).toBeVisible();
		await expect.element(definitionField()).toHaveValue('');
		expect(page.getByText(/Na podstawie/).elements()).toHaveLength(0);
	});

	it('says Wikipedia did not answer and searches again on request', async () => {
		renderNew();
		vi.mocked(searchArticles).mockRejectedValue(new Error('offline'));
		await nameField().fill('nawa');
		await category(m.glossary.categoryNames.architecture).click();
		await vi.advanceTimersByTimeAsync(700);

		await expect.element(page.getByText(m.glossary.form.definitionFailed)).toBeVisible();

		vi.mocked(searchArticles).mockResolvedValue([NAWA]);
		await page.getByRole('button', { name: m.glossary.form.searchAgain }).click();

		await expect.element(definitionField()).toHaveValue(NAWA.extract);
		expect(page.getByText(m.glossary.form.definitionFailed).elements()).toHaveLength(0);
	});

	it('lists the found articles with the current one chosen and fills in the picked one', async () => {
		renderNew();
		await fillAndSearch();

		await page.getByRole('button', { name: m.glossary.form.pickArticle }).click();

		await expect
			.element(page.getByRole('dialog', { name: m.glossary.articles.title }))
			.toBeVisible();
		await expect
			.element(
				page.getByText(m.glossary.articles.description('nawa', 'architektura'), { exact: true })
			)
			.toBeVisible();
		await expect.element(page.getByRole('radio', { name: /^Nawa/ })).toBeChecked();
		await expect.element(page.getByRole('radio', { name: /^Transept/ })).not.toBeChecked();

		await page.getByRole('radio', { name: /^Transept/ }).click();
		await page.getByRole('button', { name: m.glossary.articles.use }).click();

		await expect.element(definitionField()).toHaveValue(TRANSEPT.extract);
		await expect.element(page.getByText(/„Transept”/)).toBeVisible();
		expect(searchArticles).toHaveBeenCalledTimes(1);
	});

	it('keeps the definition when the article picker is cancelled', async () => {
		renderNew();
		await fillAndSearch();

		await page.getByRole('button', { name: m.glossary.form.pickArticle }).click();
		await page.getByRole('radio', { name: /^Transept/ }).click();
		await page.getByRole('button', { name: m.glossary.articles.cancel }).click();

		await expect.element(definitionField()).toHaveValue(NAWA.extract);
	});

	it('asks before an article replaces a definition the learner changed', async () => {
		renderNew();
		await fillAndSearch();
		await definitionField().fill('My own words about the nave.');

		await page.getByRole('button', { name: m.glossary.form.pickArticle }).click();
		await page.getByRole('radio', { name: /^Transept/ }).click();
		await page.getByRole('button', { name: m.glossary.articles.use }).click();

		await expect
			.element(page.getByRole('alertdialog', { name: m.glossary.replaceConfirm.title }))
			.toBeVisible();
		await expect.element(page.getByText(m.glossary.replaceConfirm.description)).toBeVisible();
		await expect.element(definitionField()).toHaveValue('My own words about the nave.');

		await page.getByRole('button', { name: m.glossary.replaceConfirm.keep }).click();

		await expect.element(definitionField()).toHaveValue('My own words about the nave.');
		await expect.element(page.getByText(/„Nawa”/)).toBeVisible();

		await page.getByRole('button', { name: m.glossary.form.pickArticle }).click();
		await page.getByRole('radio', { name: /^Transept/ }).click();
		await page.getByRole('button', { name: m.glossary.articles.use }).click();
		await page.getByRole('button', { name: m.glossary.replaceConfirm.replace }).click();

		await expect.element(definitionField()).toHaveValue(TRANSEPT.extract);
		await expect.element(page.getByText(/„Transept”/)).toBeVisible();
	});

	it('removes the source and keeps the text', async () => {
		renderNew();
		await fillAndSearch();

		await page.getByRole('button', { name: m.glossary.form.removeSource }).click();

		await expect.element(definitionField()).toHaveValue(NAWA.extract);
		expect(page.getByText(/Na podstawie/).elements()).toHaveLength(0);
		expect(page.getByRole('button', { name: m.glossary.form.pickArticle }).elements()).toHaveLength(
			0
		);
	});

	it('saves the entry with its source and other forms, then opens its page with a toast', async () => {
		renderNew();
		await fillAndSearch([NAWA]);
		await page.getByRole('combobox', { name: m.glossary.form.forms }).fill('nawy');
		await userEvent.keyboard('{Enter}');
		await page.getByRole('combobox', { name: m.glossary.form.forms }).fill('nawie');
		await userEvent.keyboard('{Enter}');

		await saveButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalledWith(
			{
				name: 'nawa',
				category: 'architecture',
				definition: NAWA.extract,
				synonyms: [],
				forms: ['nawy', 'nawie'],
				sortByOther: false,
				sortName: '',
				source: {
					title: 'Nawa',
					url: 'https://pl.wikipedia.org/wiki/Nawa',
					licence: 'CC BY-SA 4.0',
					fetchedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
				}
			},
			undefined
		);
		expect(goto).toHaveBeenCalledWith('/atelier/glossary/new-id', {
			replace: true,
			refreshAll: true,
			state: { glossaryMessage: m.glossary.view.saved('nawa') }
		});
	});

	it('saves the synonyms and a sort name chosen under the name', async () => {
		renderNew();
		await fillAndSearch([NAWA]);
		await page.getByRole('combobox', { name: m.glossary.form.synonyms }).fill('nawa główna');
		await userEvent.keyboard('{Enter}');
		await page.getByText(m.glossary.form.sortByOther).click();
		await page.getByRole('textbox', { name: m.glossary.form.sortName }).fill('Nawa, główna');

		await saveButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalledWith(
			expect.objectContaining({
				synonyms: ['nawa główna'],
				forms: [],
				sortByOther: true,
				sortName: 'Nawa, główna'
			}),
			undefined
		);
	});

	it('keeps the forms of a new entry open while the learner adds them', async () => {
		renderNew();
		const forms = page.getByRole('combobox', { name: m.glossary.form.forms });

		await forms.fill('nawy');
		await userEvent.keyboard('{Enter}');

		await expect.element(forms).toBeVisible();
		await expect.element(page.getByText(m.glossary.form.formsCount(1))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.glossary.form.hideForms, exact: true }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('fills the forms from Wiktionary, collapsed behind their number, and saves them', async () => {
		vi.mocked(fetchForms).mockResolvedValue(['nawy', 'nawie']);
		renderNew();
		await fillAndSearch([NAWA]);

		expect(fetchForms).toHaveBeenCalledWith('nawa');
		await expect.element(page.getByText(m.glossary.form.formsCount(2))).toBeVisible();
		await expect.element(page.getByText('nawy', { exact: true })).not.toBeInTheDocument();

		await page.getByRole('button', { name: m.glossary.form.showForms, exact: true }).click();
		await expect.element(page.getByText('nawy', { exact: true })).toBeVisible();

		await saveButton().click();
		expect(saveGlossaryEntry).toHaveBeenCalledWith(
			expect.objectContaining({ forms: ['nawy', 'nawie'] }),
			undefined
		);
	});

	it('fetches the forms again after the name changes, while they are still the fetched ones', async () => {
		vi.mocked(fetchForms).mockResolvedValue(['nawy']);
		renderNew();
		await fillAndSearch([NAWA]);

		vi.mocked(fetchForms).mockResolvedValue(['nawy bocznej']);
		await nameField().fill('nawa boczna');
		await vi.advanceTimersByTimeAsync(700);

		expect(fetchForms).toHaveBeenLastCalledWith('nawa boczna');
		await page.getByRole('button', { name: m.glossary.form.showForms, exact: true }).click();
		await expect.element(page.getByText('nawy bocznej', { exact: true })).toBeVisible();
		await expect.element(page.getByText('nawy', { exact: true })).not.toBeInTheDocument();
	});

	it('says Wiktionary has no entry and leaves the forms open for typing', async () => {
		renderNew();
		await fillAndSearch([NAWA]);

		await expect.element(page.getByText(m.glossary.form.formsNone)).toBeVisible();
		await expect.element(page.getByRole('combobox', { name: m.glossary.form.forms })).toBeVisible();
	});

	it('does not ask Wiktionary for a person or a name of more than two words', async () => {
		renderNew();
		await nameField().fill('Giorgio Vasari');
		await category(m.glossary.categoryNames.person).click();
		await vi.advanceTimersByTimeAsync(700);

		await expect.element(page.getByText(m.glossary.form.formsSkipped)).toBeVisible();

		await nameField().fill('ołtarz z predellą boczną');
		await category(m.glossary.categoryNames.architecture).click();
		await vi.advanceTimersByTimeAsync(700);

		await expect.element(page.getByText(m.glossary.form.formsSkipped)).toBeVisible();
		expect(fetchForms).not.toHaveBeenCalled();
	});

	it('says Wiktionary did not answer and tries again on request', async () => {
		vi.mocked(fetchForms).mockRejectedValueOnce(new Error('offline'));
		renderNew();
		await fillAndSearch([NAWA]);

		await expect.element(page.getByText(m.glossary.form.formsFailed)).toBeVisible();

		vi.mocked(fetchForms).mockResolvedValue(['nawy']);
		await page.getByRole('button', { name: m.glossary.form.searchAgain }).click();

		await expect.element(page.getByText(m.glossary.form.formsCount(1))).toBeVisible();
	});

	it('offers a form that differs from the name only by its diacritics, but not the name itself', async () => {
		renderNew();
		await nameField().fill('Nawa');
		const forms = page.getByRole('combobox', { name: m.glossary.form.forms });

		await forms.fill('nawa');
		await expect.element(page.getByRole('option', { name: /nawa/ })).not.toBeInTheDocument();

		await forms.fill('nawą');
		await expect.element(page.getByRole('option', { name: /nawą/ })).toBeInTheDocument();
	});

	it('saves an entry without a definition when Wikipedia has nothing', async () => {
		renderNew();
		await fillAndSearch([], 'xyzzy');

		await saveButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'xyzzy', definition: '', source: null }),
			undefined
		);
	});

	it('warns that a person is already an author of the card index and links to the author', async () => {
		renderNew();

		await nameField().fill('Phidias');
		await category(m.glossary.categoryNames.person).click();

		await expect
			.element(page.getByRole('link', { name: 'Phidias' }))
			.toHaveAttribute('href', '/atelier/values/author/author-phidias');
		await expect.element(page.getByText(m.glossary.form.authorWarningSuffix.trim())).toBeVisible();

		await saveButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalled();
	});

	it('does not warn about an author for another category or another name', async () => {
		renderNew();

		await nameField().fill('Phidias');
		await category(m.glossary.categoryNames.sculpture).click();
		await expect
			.element(page.getByText(m.glossary.form.authorWarningSuffix.trim()))
			.not.toBeInTheDocument();

		await category(m.glossary.categoryNames.person).click();
		await nameField().fill('Praxiteles');

		await expect
			.element(page.getByText(m.glossary.form.authorWarningSuffix.trim()))
			.not.toBeInTheDocument();
	});

	it('asks before discarding changes and leaves without asking when nothing changed', async () => {
		renderNew();
		const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
		const navigation = {
			type: 'link',
			to: { url: new URL('http://localhost/atelier/glossary') },
			cancel: vi.fn()
		};
		type Leave = Parameters<typeof guard>[0];

		guard(navigation as unknown as Leave);
		expect(navigation.cancel).not.toHaveBeenCalled();

		await nameField().fill('Sfumato');
		guard(navigation as unknown as Leave);

		expect(navigation.cancel).toHaveBeenCalled();
		await expect
			.element(page.getByRole('alertdialog', { name: m.artworkForm.discardTitle }))
			.toBeVisible();
		await expect.element(page.getByText(m.glossary.form.discardDescription)).toBeVisible();
	});

	it('shows a load error instead of the form', async () => {
		renderNew(m.common.unexpectedError);

		await expect.element(page.getByText(m.common.unexpectedError)).toBeVisible();
		expect(page.getByLabelText(m.glossary.form.name).elements()).toHaveLength(0);
		await expect
			.element(page.getByRole('main').getByRole('link', { name: m.glossary.back }))
			.toHaveAttribute('href', '/atelier/glossary');
	});
});
