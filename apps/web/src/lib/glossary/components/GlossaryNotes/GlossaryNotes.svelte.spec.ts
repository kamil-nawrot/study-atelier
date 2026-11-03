import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { loadTermDefinition } from '#lib/glossary/glossary-data/glossary-data.ts';
import { testEntry, testGlossary, testTermDefinition } from '#lib/testing/glossary/glossary.ts';
import GlossaryNotes from './GlossaryNotes.svelte';

vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ loadTermDefinition: vi.fn() }));

describe('GlossaryNotes', () => {
	beforeEach(() => {
		vi.mocked(loadTermDefinition).mockReset().mockImplementation(testTermDefinition);
	});

	it('marks a word of the glossary and shows its card on a click', async () => {
		render(GlossaryNotes, {
			entries: testGlossary(),
			value: 'The tympana of the temple were carved.'
		});

		await page.getByRole('button', { name: 'tympana' }).click();

		const card = page.getByRole('dialog');
		await expect.element(card).toHaveTextContent('Tympanum');
		await expect.element(card).toHaveTextContent(m.glossary.categoryNames.architecture);
		await expect.element(card).toHaveTextContent('Tympanum is a test definition.');
		await expect.element(card).toHaveTextContent(m.glossary.card.source);
	});

	it('marks a synonym of an entry like its name', async () => {
		render(GlossaryNotes, {
			entries: testGlossary(),
			value: 'A carved tympan over the door.'
		});

		await page.getByRole('button', { name: 'tympan' }).click();

		await expect.element(page.getByRole('dialog')).toHaveTextContent('Tympanum');
	});

	it('leaves the source line out when the entry has no source', async () => {
		render(GlossaryNotes, {
			entries: [testEntry('a-fresco', 'Fresco')],
			value: 'A wall painted in fresco.'
		});

		await page.getByRole('button', { name: 'fresco' }).click();

		await expect.element(page.getByRole('dialog')).not.toHaveTextContent(m.glossary.card.source);
	});

	it('leads from the card to the page of the entry', async () => {
		render(GlossaryNotes, {
			entries: testGlossary(),
			value: 'The tympana of the temple were carved.'
		});

		await page.getByRole('button', { name: 'tympana' }).click();

		await expect
			.element(page.getByRole('dialog').getByRole('link', { name: m.glossary.card.open }))
			.toHaveAttribute('href', '/atelier/glossary/a-tympanum');
	});

	it('shows the card without the link when it should not lead away', async () => {
		render(GlossaryNotes, {
			entries: testGlossary(),
			linked: false,
			value: 'The tympana of the temple were carved.'
		});

		await page.getByRole('button', { name: 'tympana' }).click();

		await expect.element(page.getByRole('tooltip')).toHaveTextContent('Tympanum');
		expect(page.getByRole('link').elements()).toHaveLength(0);
	});

	it('loads the definition of a term only when its card opens', async () => {
		render(GlossaryNotes, {
			entries: testGlossary(),
			value: 'The tympana and the abacus.'
		});
		expect(loadTermDefinition).not.toHaveBeenCalled();

		await page.getByRole('button', { name: 'tympana' }).click();

		await expect
			.element(page.getByRole('dialog'))
			.toHaveTextContent('Tympanum is a test definition.');
		expect(loadTermDefinition).toHaveBeenCalledExactlyOnceWith('a-tympanum');
	});

	it('shows a placeholder while the definition loads', async () => {
		vi.mocked(loadTermDefinition).mockReturnValue(new Promise(() => {}));
		render(GlossaryNotes, { entries: testGlossary(), value: 'The tympana.' });

		await page.getByRole('button', { name: 'tympana' }).click();

		await expect.element(page.getByRole('dialog')).toHaveTextContent(m.glossary.card.loading);
	});

	it('announces the definition once it has loaded', async () => {
		render(GlossaryNotes, { entries: testGlossary(), value: 'The tympana.' });

		await page.getByRole('button', { name: 'tympana' }).click();

		await expect
			.element(page.getByRole('dialog').getByRole('status'))
			.toHaveTextContent('Tympanum is a test definition.');
	});

	it('says so when the definition cannot be loaded, and tries again on the next opening', async () => {
		vi.mocked(loadTermDefinition).mockResolvedValueOnce({ error: 'Brak sieci.' });
		render(GlossaryNotes, { entries: testGlossary(), value: 'The tympana.' });
		const term = page.getByRole('button', { name: 'tympana' });

		await term.click();
		await expect.element(page.getByRole('dialog')).toHaveTextContent(m.glossary.card.failed);
		await term.click();
		await term.click();

		await expect
			.element(page.getByRole('dialog'))
			.toHaveTextContent('Tympanum is a test definition.');
		expect(loadTermDefinition).toHaveBeenCalledTimes(2);
	});

	it('says so when the term was deleted meanwhile, without the link to it', async () => {
		vi.mocked(loadTermDefinition).mockResolvedValue({ notFound: true });
		render(GlossaryNotes, { entries: testGlossary(), value: 'The tympana.' });

		await page.getByRole('button', { name: 'tympana' }).click();

		await expect.element(page.getByRole('dialog')).toHaveTextContent(m.glossary.card.deleted);
		expect(page.getByRole('link').elements()).toHaveLength(0);
	});

	it('loads nothing for a term without a definition', async () => {
		render(GlossaryNotes, {
			entries: [testEntry('a-fresco', 'Fresco', { definition: '' })],
			value: 'A wall painted in fresco.'
		});

		await page.getByRole('button', { name: 'fresco' }).click();

		await expect.element(page.getByRole('dialog')).toHaveTextContent('Fresco');
		expect(loadTermDefinition).not.toHaveBeenCalled();
	});

	it('shows the note as it is when the glossary is empty', async () => {
		render(GlossaryNotes, { value: 'A wall painted in fresco.' });

		await expect.element(page.getByText('A wall painted in fresco.')).toBeVisible();
		expect(page.getByRole('button').elements()).toHaveLength(0);
	});
});
