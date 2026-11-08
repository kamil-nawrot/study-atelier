import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import TermFigure from './TermFigure.svelte';

vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({
	loadTermDefinition: vi.fn().mockResolvedValue({
		definition: 'Miękkie przejścia światła i cienia bez ostrych konturów.',
		source: null
	})
}));

const sfumato: GlossaryTerm = {
	id: 't1',
	name: 'Sfumato',
	category: 'technique',
	synonyms: [],
	forms: [],
	hasDefinition: true
};

describe('TermFigure', () => {
	it('shows the name and the definition of the term', async () => {
		render(TermFigure, { termId: 't1', terms: [sfumato] });

		await expect
			.element(page.getByRole('complementary', { name: m.exhibitions.blocks.termOf('Sfumato') }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Sfumato', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText(/Miękkie przejścia/)).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.glossary.card.open }))
			.not.toBeInTheDocument();
	});

	it('links to the glossary when viewed', async () => {
		render(TermFigure, { termId: 't1', terms: [sfumato], linked: true });

		await expect
			.element(page.getByRole('link', { name: m.glossary.card.open }))
			.toHaveAttribute('href', '/atelier/glossary/t1');
	});

	it('says when the term is gone from the glossary', async () => {
		render(TermFigure, { termId: 'gone', terms: [sfumato] });

		await expect.element(page.getByText(m.glossary.card.deleted)).toBeInTheDocument();
	});
});
