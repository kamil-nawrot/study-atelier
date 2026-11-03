import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { DefinedTerm } from '#lib/review/types/defined-term.ts';
import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import {
	definitionItems,
	definitionsOffered,
	drawnTerms,
	withDefinitions,
	withDefinitionsOf
} from './definitions.ts';

function entry(
	name: string,
	category: GlossaryCategory,
	definition = `About ${name}.`
): DefinedTerm {
	return {
		id: name,
		name,
		category,
		definition,
		synonyms: [],
		forms: [],
		hasDefinition: definition.trim() !== ''
	};
}

function drawnItems(count: number, random: () => number = Math.random): DefinitionItem[] {
	const drawn = drawnTerms(glossary, count, random);
	return definitionItems(
		withDefinitionsOf(drawn, new Map(glossary.map((term) => [term.id, term.definition]))),
		glossary,
		random
	);
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

describe('drawnTerms', () => {
	it('draws the asked number of terms with a definition', () => {
		const drawn = drawnTerms([...glossary, entry('Portal', 'architecture', '')], 10, () => 0);

		expect(drawn).toHaveLength(6);
		expect(drawn.every((term) => term.hasDefinition)).toBe(true);
	});

	it('draws nothing with fewer than four defined terms', () => {
		expect(drawnTerms(glossary.slice(0, 3), 2)).toEqual([]);
	});
});

describe('withDefinitionsOf', () => {
	it('gives the drawn terms their definitions and leaves out a term that has none any more', () => {
		const drawn = glossary.slice(0, 2);

		expect(withDefinitionsOf(drawn, new Map([['Apse', 'A recess.']]))).toEqual([
			{ ...glossary[0], definition: 'A recess.' }
		]);
	});
});

describe('definitionItems', () => {
	it('asks about each drawn term with three other terms of the same category first', () => {
		const drawn = drawnItems(2, () => 0);

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
});

describe('withDefinitions', () => {
	it('never puts a definition first and keeps every artwork in order', () => {
		const definitions = drawnItems(3, () => 0);
		const steps = withDefinitions(items(4), definitions, () => 0);

		expect(steps).toHaveLength(7);
		expect(steps[0].mode).toBe('flashcard');
		expect(
			steps.flatMap((step) => (step.mode === 'quiz_definition' ? [] : [step.artwork.number]))
		).toEqual([1, 2, 3, 4]);
	});

	it('adds nothing to an empty session', () => {
		expect(withDefinitions([], drawnItems(2))).toEqual([]);
	});
});
