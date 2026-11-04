import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { NoteGapItem } from '#lib/review/types/note-gap-item.ts';
import NoteGapQuiz from './NoteGapQuiz.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const item: NoteGapItem = {
	mode: 'note_gap',
	artwork: testArtwork(1, 'Portal królewski'),
	term: {
		id: 'tympanon',
		name: 'tympanon',
		category: 'architecture',
		synonyms: [],
		forms: [],
		hasDefinition: false
	},
	segments: [
		{ text: 'W ', masked: false },
		{ text: 'tympanonie', masked: true },
		{ text: ' Chrystus.', masked: false }
	],
	quiz: {
		answer: 1,
		options: ['portal', 'tympanon', 'nawa', 'archiwolta'].map((label) => ({ label }))
	}
};

function renderQuiz(chosen?: number): {
	onanswer: ReturnType<typeof vi.fn>;
	onnext: ReturnType<typeof vi.fn>;
} {
	const onanswer = vi.fn();
	const onnext = vi.fn();
	render(NoteGapQuiz, { item, chosen, onanswer, onnext });
	return { onanswer, onnext };
}

describe('NoteGapQuiz', () => {
	it('shows the passage with a gap, its artwork and four terms', async () => {
		const quiz = renderQuiz();

		await expect.element(page.getByText(m.review.quiz.noteTag)).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.noteQuestion }))
			.toBeVisible();
		await expect.element(page.getByRole('img', { name: m.review.quiz.maskedTerm })).toBeVisible();
		await expect.element(page.getByText('tympanonie')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.review.quiz.noteSource)).toBeVisible();
		await page.getByRole('button', { name: /tympanon/ }).click();

		expect(quiz.onanswer).toHaveBeenCalledWith(1);
	});

	it('fills the gap after a wrong answer and says the question comes back', async () => {
		const quiz = renderQuiz(0);

		await expect.element(page.getByText('tympanonie')).toBeVisible();
		await expect.element(page.getByText(m.review.quiz.definitionRetry)).toBeVisible();
		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(quiz.onnext).toHaveBeenCalledOnce();
	});
});
