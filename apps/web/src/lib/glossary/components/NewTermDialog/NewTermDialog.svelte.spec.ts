import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { saveGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
import { searchArticles } from '#lib/glossary/wikipedia/wikipedia.ts';
import { testArticle, testEntry } from '#lib/testing/glossary/glossary.ts';
import NewTermDialog from './NewTermDialog.svelte';

vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ saveGlossaryEntry: vi.fn() }));
vi.mock('#lib/glossary/wikipedia/wikipedia.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/glossary/wikipedia/wikipedia.ts')>()),
	searchArticles: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const NAVE = testArticle('Nawa', 'Nawa to podłużna część wnętrza kościoła.');

function addButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.glossary.quick.add });
}

function openDialog(name = 'nawa'): ReturnType<typeof vi.fn> {
	const onadded = vi.fn();
	render(NewTermDialog, {
		open: true,
		name,
		entries: [testEntry('entry-1', 'Apsyda')],
		onadded
	});
	return onadded;
}

describe('NewTermDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
		vi.mocked(searchArticles).mockResolvedValue([NAVE]);
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ id: 'new-id' });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('takes the typed name, fills the definition from Wikipedia and adds the term', async () => {
		const onadded = openDialog();

		await expect.element(page.getByLabelText(m.common.name)).toHaveValue('nawa');
		await page.getByRole('radio', { name: m.glossary.categoryNames.architecture }).click();
		await vi.advanceTimersByTimeAsync(700);
		await expect.element(page.getByLabelText(m.glossary.form.definition)).toHaveValue(NAVE.extract);
		await addButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'nawa',
				category: 'architecture',
				definition: NAVE.extract
			})
		);
		expect(onadded).toHaveBeenCalledWith({
			id: 'new-id',
			name: 'nawa',
			kind: 'term',
			category: 'architecture',
			synonyms: [],
			forms: [],
			hasDefinition: true
		});
	});

	it('refuses a name the glossary has', async () => {
		openDialog('APSYDA');

		await addButton().click();

		await expect.element(page.getByText(m.glossary.form.nameTaken('APSYDA'))).toBeVisible();
		expect(saveGlossaryEntry).not.toHaveBeenCalled();
	});

	it('adds a term without a category', async () => {
		vi.mocked(searchArticles).mockResolvedValue([]);
		const onadded = openDialog();

		await vi.advanceTimersByTimeAsync(700);
		await addButton().click();

		expect(saveGlossaryEntry).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'nawa', kind: 'term', category: null })
		);
		expect(onadded).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'new-id', kind: 'term', category: null })
		);
	});

	it('shows why the term could not be added', async () => {
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ error: m.common.network });
		const onadded = openDialog();

		await page.getByRole('radio', { name: m.glossary.categoryNames.general }).click();
		await vi.advanceTimersByTimeAsync(700);
		await addButton().click();

		await expect.element(page.getByText(m.common.network)).toBeVisible();
		expect(onadded).not.toHaveBeenCalled();
	});

	it('says when the glossary already took the name', async () => {
		vi.mocked(saveGlossaryEntry).mockResolvedValue({ nameTaken: true });
		const onadded = openDialog('Nawa');

		await page.getByRole('radio', { name: m.glossary.categoryNames.architecture }).click();
		await vi.advanceTimersByTimeAsync(700);
		await addButton().click();

		await expect.element(page.getByText(m.glossary.form.nameTaken('Nawa'))).toBeVisible();
		expect(onadded).not.toHaveBeenCalled();
	});
});
