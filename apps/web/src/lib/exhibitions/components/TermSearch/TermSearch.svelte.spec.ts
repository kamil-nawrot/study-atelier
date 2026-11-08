import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import TermSearch from './TermSearch.svelte';

function term(id: string, name: string, synonyms: string[] = []): GlossaryTerm {
	return { id, name, category: 'technique', synonyms, forms: [], hasDefinition: true };
}

const terms = [term('t1', 'Sfumato'), term('t2', 'Światłocień', ['chiaroscuro'])];

describe('TermSearch', () => {
	it('lists the terms from A to Z and picks one on a click', async () => {
		const onpick = vi.fn();
		render(TermSearch, { terms, onpick });

		await expect.element(page.getByText(m.exhibitions.panel.termsByName)).toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: 'Światłocień' }));

		expect(onpick).toHaveBeenCalledWith(terms[1]);
	});

	it('narrows the list to what the learner types and says when nothing matches', async () => {
		render(TermSearch, { terms, onpick: vi.fn() });

		await userEvent.fill(
			page.getByRole('searchbox', { name: m.exhibitions.panel.searchTerm }),
			'chiaro'
		);
		await expect.element(page.getByRole('button', { name: 'Sfumato' })).not.toBeInTheDocument();
		await expect.element(page.getByText(m.exhibitions.panel.found(1))).toBeInTheDocument();

		await userEvent.fill(
			page.getByRole('searchbox', { name: m.exhibitions.panel.searchTerm }),
			'impast'
		);
		await expect.element(page.getByText(m.exhibitions.panel.noTerm)).toBeInTheDocument();
	});

	it('starts a drag from a term', async () => {
		const ondrag = vi.fn();
		render(TermSearch, { terms, onpick: vi.fn(), ondrag });

		page
			.getByRole('button', { name: 'Sfumato' })
			.element()
			.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

		expect(ondrag).toHaveBeenCalledWith(expect.any(PointerEvent), terms[0]);
	});

	it('says when the glossary is empty and offers no search', async () => {
		render(TermSearch, { terms: [], onpick: vi.fn() });

		await expect.element(page.getByText(m.exhibitions.panel.noTerms)).toBeInTheDocument();
		await expect.element(page.getByRole('searchbox')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.exhibitions.panel.browseGlossary }))
			.toBeInTheDocument();
	});
});
