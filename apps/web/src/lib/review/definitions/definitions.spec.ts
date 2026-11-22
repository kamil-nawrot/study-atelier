import { describe, expect, it } from 'vitest';
import { isFigure } from '#lib/glossary/categories/categories.ts';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { DefinedTerm } from '#lib/review/types/defined-term.ts';
import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import { definitionCount, definitionItems, roundTerms, withDefinitionsOf } from './definitions.ts';

function entry(
	name: string,
	category: GlossaryCategory,
	definition = `About ${name}.`
): DefinedTerm {
	return {
		id: name,
		name,
		kind: isFigure(category) ? 'figure' : 'term',
		category,
		definition,
		synonyms: [],
		forms: [],
		hasDefinition: definition.trim() !== ''
	};
}

function drawnItems(count: number, random: () => number = Math.random): DefinitionItem[] {
	const drawn = glossary.slice(0, count);
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

describe('definitionCount', () => {
	it('asks the count of glossary questions only with the switch on', () => {
		expect(definitionCount({ reviewGlossaryOn: true, reviewGlossaryQuestions: 3 })).toBe(3);
		expect(definitionCount({ reviewGlossaryOn: false, reviewGlossaryQuestions: 3 })).toBe(0);
	});
});

describe('roundTerms', () => {
	it('keeps the order of the round and leaves out a term no longer in the glossary', () => {
		const picked = [
			{ id: 'Nave', card: null },
			{ id: 'Gone', card: null },
			{ id: 'Apse', card: null }
		];

		expect(roundTerms(picked, glossary).map((term) => term.name)).toEqual(['Nave', 'Apse']);
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

	it('fills a figure question with figures of other categories before terms', () => {
		const figures = [
			entry('Charlemagne', 'ruler'),
			entry('Otto', 'ruler'),
			entry('Giotto', 'artist'),
			entry('Duccio', 'artist'),
			...glossary
		];
		const [item] = definitionItems([figures[0]], figures, Math.random);

		const labels = item.quiz.options.map((option) => option.label).sort();
		expect(labels).toEqual(['Charlemagne', 'Duccio', 'Giotto', 'Otto']);
	});

	it('fills a term question with terms of other categories before figures', () => {
		const mixed = [
			entry('Apse', 'architecture'),
			entry('Nave', 'architecture'),
			entry('Impasto', 'technique'),
			entry('Sfumato', 'technique'),
			entry('Giotto', 'artist'),
			entry('Duccio', 'artist')
		];
		const [item] = definitionItems([mixed[0]], mixed, Math.random);

		const labels = item.quiz.options.map((option) => option.label).sort();
		expect(labels).toEqual(['Apse', 'Impasto', 'Nave', 'Sfumato']);
	});
});
