import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { testEntry, testGlossary } from '#lib/testing/glossary.ts';
import GlossaryNotes from './GlossaryNotes.svelte';

describe('GlossaryNotes', () => {
	it('marks a word of the glossary and shows its card on a click', async () => {
		render(GlossaryNotes, {
			entries: testGlossary(),
			value: 'The tympana of the temple were carved.'
		});

		await page.getByRole('button', { name: 'tympana' }).click();

		const card = page.getByRole('tooltip');
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

		await expect.element(page.getByRole('tooltip')).toHaveTextContent('Tympanum');
	});

	it('leaves the source line out when the entry has no source', async () => {
		render(GlossaryNotes, {
			entries: [testEntry('a-fresco', 'Fresco')],
			value: 'A wall painted in fresco.'
		});

		await page.getByRole('button', { name: 'fresco' }).click();

		await expect.element(page.getByRole('tooltip')).not.toHaveTextContent(m.glossary.card.source);
	});

	it('shows the note as it is when the glossary is empty', async () => {
		render(GlossaryNotes, { value: 'A wall painted in fresco.' });

		await expect.element(page.getByText('A wall painted in fresco.')).toBeVisible();
		expect(page.getByRole('button').elements()).toHaveLength(0);
	});
});
