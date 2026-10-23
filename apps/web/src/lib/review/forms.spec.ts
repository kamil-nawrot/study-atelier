import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/collection/types.ts';
import { offeredForms, quizzesPossible } from './forms.ts';

function artwork(styles: string[]): WallArtwork {
	return { styles } as unknown as WallArtwork;
}

describe('quizzesPossible', () => {
	it('allows quizzes while the title or the image quiz is on', () => {
		expect(quizzesPossible(['quiz_title'], [], 0)).toBe(true);
		expect(quizzesPossible(['quiz_image'], [], 0)).toBe(true);
	});

	it('allows the style quiz only when an artwork has a style', () => {
		expect(quizzesPossible(['quiz_style'], [artwork([])], 0)).toBe(false);
		expect(quizzesPossible(['quiz_style'], [artwork(['Tenebrism'])], 0)).toBe(true);
	});

	it('allows the pin quiz only when a pin names a glossary entry', () => {
		expect(quizzesPossible(['quiz_pin'], [], 0)).toBe(false);
		expect(quizzesPossible(['quiz_pin'], [], 2)).toBe(true);
	});

	it('keeps quizzes when the pins could not be counted', () => {
		expect(quizzesPossible(['quiz_pin'], [], undefined)).toBe(true);
	});
});

describe('offeredForms', () => {
	it('leaves out "Quizy" when no quiz can be asked', () => {
		expect(offeredForms(true)).toEqual(['mixed', 'flashcards', 'quizzes']);
		expect(offeredForms(false)).toEqual(['mixed', 'flashcards']);
	});
});
