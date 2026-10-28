import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import DefinitionQuiz from './DefinitionQuiz.svelte';

const item: DefinitionItem = {
	mode: 'quiz_definition',
	term: {
		id: 'apse',
		name: 'Absyda',
		category: 'architecture',
		definition: 'Absyda zamyka nawę kościoła. W apsydzie stoi ołtarz.',
		synonyms: ['apsyda'],
		forms: ['apsydzie'],
		sortName: null,
		source: null
	},
	quiz: {
		answer: 0,
		options: ['Absyda', 'Krypta', 'Transept', 'Prezbiterium'].map((label) => ({ label }))
	}
};

function renderQuiz(chosen?: number): {
	onanswer: ReturnType<typeof vi.fn>;
	onnext: ReturnType<typeof vi.fn>;
} {
	const onanswer = vi.fn();
	const onnext = vi.fn();
	render(DefinitionQuiz, { item, chosen, onanswer, onnext });
	return { onanswer, onnext };
}

describe('DefinitionQuiz', () => {
	it('asks for the term of a definition with every form of the term hidden', async () => {
		const { onanswer } = renderQuiz();

		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.definitionQuestion }))
			.toBeVisible();
		await expect.element(page.getByText(m.review.quiz.definitionTag)).toBeVisible();
		const definition = document.querySelector('.definition');
		expect(definition?.textContent).not.toMatch(/absyd|apsyd/i);
		expect(page.getByRole('img', { name: m.review.quiz.maskedTerm }).elements()).toHaveLength(2);

		await page.getByRole('button', { name: /Krypta/ }).click();
		expect(onanswer).toHaveBeenCalledWith(1);
	});

	it('names the right term, shows the hidden words and moves on', async () => {
		const { onnext } = renderQuiz(1);

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(`${m.review.quiz.wrong} Absyda.`);
		await expect.element(page.getByText(m.review.quiz.definitionRetry)).toBeVisible();
		expect(document.querySelector('.definition')?.textContent).toContain('apsydzie');

		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(onnext).toHaveBeenCalled();
	});
});
