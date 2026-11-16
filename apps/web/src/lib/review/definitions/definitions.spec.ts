import { describe, expect, it } from 'vitest';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { DefinedTerm } from '#lib/review/types/defined-term.ts';
import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import {
	definitionItems,
	definitionsOffered,
	pickedTerms,
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
	const drawn = pickedTerms(glossary, new Map(), count, now, random);
	return definitionItems(
		withDefinitionsOf(drawn, new Map(glossary.map((term) => [term.id, term.definition]))),
		glossary,
		random
	);
}

const now = new Date('2026-11-16T12:00:00');

const glossary = [
	entry('Apse', 'architecture'),
	entry('Nave', 'architecture'),
	entry('Crypt', 'architecture'),
	entry('Choir', 'architecture'),
	entry('Impasto', 'technique'),
	entry('Sfumato', 'technique')
];

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

describe('pickedTerms', () => {
	it('draws the asked number of terms with a definition', () => {
		const drawn = pickedTerms(
			[...glossary, entry('Portal', 'architecture', '')],
			new Map(),
			10,
			now,
			() => 0
		);

		expect(drawn).toHaveLength(6);
		expect(drawn.every((term) => term.hasDefinition)).toBe(true);
	});

	it('asks a due term first and skips a due term without a definition', () => {
		const due = {
			id: 'card',
			termId: 'Nave',
			symbolId: null,
			due: new Date('2026-11-14T08:00:00'),
			stability: 2,
			difficulty: 5,
			state: 2 as const,
			reps: 1,
			lapses: 0,
			scheduledDays: 2,
			learningSteps: 0,
			lastReview: null,
			lastRating: 2 as const
		};
		const cards = new Map([
			['Nave', due],
			['Portal', { ...due, termId: 'Portal' }],
			['Apse', { ...due, termId: 'Apse', due: new Date('2026-12-01T08:00:00') }]
		]);

		const drawn = pickedTerms([...glossary, entry('Portal', 'architecture', '')], cards, 6, now);

		expect(drawn[0].name).toBe('Nave');
		expect(drawn.map((term) => term.name)).not.toContain('Portal');
		expect(drawn.map((term) => term.name)).not.toContain('Apse');
		expect(drawn).toHaveLength(5);
	});

	it('draws nothing with fewer than four defined terms', () => {
		expect(pickedTerms(glossary.slice(0, 3), new Map(), 2, now)).toEqual([]);
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
