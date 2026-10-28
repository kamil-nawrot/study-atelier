import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import { definitionItems, definitionsOffered, withDefinitions } from './definitions.ts';

function entry(
	name: string,
	category: GlossaryCategory,
	definition = `About ${name}.`
): GlossaryEntry {
	return {
		id: name,
		name,
		category,
		definition,
		synonyms: [],
		forms: [],
		sortName: null,
		source: null
	};
}

const glossary = [
	entry('Apse', 'architecture'),
	entry('Nave', 'architecture'),
	entry('Crypt', 'architecture'),
	entry('Choir', 'architecture'),
	entry('Impasto', 'technique'),
	entry('Sfumato', 'technique')
];

function items(count: number): ReviewItem[] {
	return Array.from({ length: count }, (_, index) => ({
		artwork: testArtwork(index + 1, `Artwork ${index + 1}`),
		card: null,
		mode: 'flashcard'
	}));
}

describe('definitionsOffered', () => {
	it('needs four different terms with a definition', () => {
		const three = [
			...glossary.slice(0, 3),
			entry('Apse', 'general'),
			entry('Portal', 'architecture', ' ')
		];
		expect(definitionsOffered(three)).toBe(false);
		expect(definitionsOffered(glossary.slice(0, 4))).toBe(true);
	});
});

describe('definitionItems', () => {
	it('draws the asked number of terms with three other terms of the same category first', () => {
		const drawn = definitionItems(glossary, 2, () => 0);

		expect(drawn).toHaveLength(2);
		for (const item of drawn) {
			const labels = item.quiz.options.map((option) => option.label);
			expect(new Set(labels).size).toBe(4);
			expect(labels[item.quiz.answer]).toBe(item.term.name);
			if (item.term.category === 'architecture') {
				expect(labels.every((label) => !['Impasto', 'Sfumato'].includes(label))).toBe(true);
			}
		}
	});

	it('draws nothing with fewer than four defined terms', () => {
		expect(definitionItems(glossary.slice(0, 3), 2)).toEqual([]);
	});
});

describe('withDefinitions', () => {
	it('never puts a definition first and keeps every artwork in order', () => {
		const definitions = definitionItems(glossary, 3, () => 0);
		const steps = withDefinitions(items(4), definitions, () => 0);

		expect(steps).toHaveLength(7);
		expect(steps[0].mode).toBe('flashcard');
		expect(
			steps.flatMap((step) => (step.mode === 'quiz_definition' ? [] : [step.artwork.number]))
		).toEqual([1, 2, 3, 4]);
	});

	it('adds nothing to an empty session', () => {
		expect(withDefinitions([], definitionItems(glossary, 2))).toEqual([]);
	});
});
