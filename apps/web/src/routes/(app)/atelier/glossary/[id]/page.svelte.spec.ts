import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/index.ts';
import { deleteGlossaryEntry } from '#lib/glossary/glossary-data.ts';
import type { Mention } from '#lib/collection/mentions.ts';
import type { GlossaryEntry } from '#lib/glossary/types.ts';
import { testSession } from '#lib/testing/auth.ts';
import { testEntry, testGlossary } from '#lib/testing/glossary.ts';
import GlossaryEntryPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/glossary/a-tympanum'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/glossary/glossary-data.ts', () => ({ deleteGlossaryEntry: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const tympanum = testGlossary()[0];

function renderEntry(
	entry: GlossaryEntry | null = tympanum,
	failure: { error?: string; notFound?: boolean; mentions?: Mention[] } = {}
): void {
	render(GlossaryEntryPage, {
		data: { session: testSession(), entry: entry ?? undefined, ...failure },
		params: { id: entry?.id ?? 'unknown' }
	});
}

describe('glossary entry page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		await page.viewport(1280, 800);
		vi.mocked(deleteGlossaryEntry).mockResolvedValue({});
	});

	it('shows the category, the name, the synonyms, the definition and its source', async () => {
		renderEntry();

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Tympanum');
		await expect
			.element(page.getByText(m.glossary.categoryNames.architecture, { exact: true }).first())
			.toBeVisible();
		await expect.element(page.getByText(m.glossary.view.also('tympan'))).toBeVisible();
		await expect.element(page.getByText(/tympana/)).not.toBeInTheDocument();
		await expect.element(page.getByText(tympanum.definition)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: '„Tympanum”' }))
			.toHaveAttribute('href', 'https://pl.wikipedia.org/wiki/Tympanum');
		await expect
			.element(page.getByRole('link', { name: 'CC BY-SA 4.0' }))
			.toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/deed.pl');
	});

	it('leaves out the forms line and the source line when the entry has neither', async () => {
		renderEntry(testEntry('plain', 'Plain'));

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Plain');
		expect(page.getByText(/^też:/).elements()).toHaveLength(0);
		expect(page.getByText(/Na podstawie/).elements()).toHaveLength(0);
	});

	it('lists the notes where the entry appears and hides the section when there are none', async () => {
		renderEntry(tympanum, {
			mentions: [{ href: '/atelier/3', name: '#0003 Temple', kind: m.mentions.artwork }]
		});

		await expect
			.element(page.getByRole('heading', { name: m.glossary.view.mentionsHeading }))
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: '#0003 Temple' }))
			.toHaveAttribute('href', '/atelier/3');
	});

	it('has no notes section without mentions', async () => {
		renderEntry();

		await expect.element(page.getByRole('heading', { level: 1 })).toBeVisible();
		expect(
			page.getByRole('heading', { name: m.glossary.view.mentionsHeading }).elements()
		).toHaveLength(0);
	});

	it('says there is no definition yet', async () => {
		renderEntry(testEntry('empty', 'Empty', { definition: '' }));

		await expect.element(page.getByText(m.glossary.view.noDefinition)).toBeVisible();
	});

	it('keeps Edytuj and Usuń in the top bar and links Edytuj to the form', async () => {
		renderEntry();

		await expect
			.element(page.getByRole('link', { name: m.glossary.view.edit }))
			.toHaveAttribute('href', '/atelier/glossary/a-tympanum/edit');
		await expect.element(page.getByRole('button', { name: m.glossary.view.delete })).toBeVisible();
		await expect
			.element(page.getByRole('main').getByRole('link', { name: m.glossary.back }))
			.not.toBeInTheDocument();
	});

	it('asks before deleting and keeps the entry when the learner stays', async () => {
		renderEntry();

		await page.getByRole('button', { name: m.glossary.view.delete }).click();

		await expect
			.element(page.getByRole('alertdialog', { name: m.glossary.deleteConfirm.title('Tympanum') }))
			.toBeVisible();
		await expect.element(page.getByText(m.glossary.deleteConfirm.description)).toBeVisible();

		await page.getByRole('button', { name: m.glossary.deleteConfirm.back }).click();

		expect(deleteGlossaryEntry).not.toHaveBeenCalled();
		expect(goto).not.toHaveBeenCalled();
	});

	it('deletes the entry and returns to the list with a toast', async () => {
		renderEntry();

		await page.getByRole('button', { name: m.glossary.view.delete }).click();
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: m.glossary.deleteConfirm.confirm })
			.click();

		expect(deleteGlossaryEntry).toHaveBeenCalledWith('a-tympanum');
		expect(goto).toHaveBeenCalledWith('/atelier/glossary', {
			refreshAll: true,
			state: { glossaryMessage: m.glossary.view.deleted('Tympanum') }
		});
	});

	it('shows a failed delete in the dialog and stays on the page', async () => {
		vi.mocked(deleteGlossaryEntry).mockResolvedValue({ error: m.common.unexpectedError });
		renderEntry();

		await page.getByRole('button', { name: m.glossary.view.delete }).click();
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: m.glossary.deleteConfirm.confirm })
			.click();

		await expect.element(page.getByText(m.common.unexpectedError)).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});

	it('shows the toast of a saved entry once and clears it from the history state', async () => {
		navigation.state = { glossaryMessage: m.glossary.view.saved('Tympanum') };
		renderEntry();

		await expect.element(page.getByText(m.glossary.view.saved('Tympanum'))).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/glossary/a-tympanum', {
			state: {},
			shallow: true,
			replace: true
		});
	});

	it('says the entry does not exist', async () => {
		renderEntry(null, { notFound: true });

		await expect.element(page.getByText(m.glossary.view.notFound)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.glossary.view.edit }))
			.not.toBeInTheDocument();
	});

	it('shows a load error', async () => {
		renderEntry(null, { error: m.common.unexpectedError });

		await expect.element(page.getByText(m.common.unexpectedError)).toBeVisible();
	});
});
