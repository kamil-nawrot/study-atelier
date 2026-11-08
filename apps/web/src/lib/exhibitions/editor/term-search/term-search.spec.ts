import { describe, expect, it } from 'vitest';
import { matchingTerms, termOf } from '#lib/exhibitions/editor/term-search/term-search.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

function term(id: string, name: string, synonyms: string[] = []): GlossaryTerm {
	return { id, name, category: 'technique', synonyms, forms: [], hasDefinition: true };
}

const terms = [
	term('t1', 'Sfumato'),
	term('t2', 'Światłocień', ['chiaroscuro']),
	term('t3', 'Impast'),
	term('t4', 'Laserunek', ['lazura'])
];

describe('matchingTerms', () => {
	it('lists the terms by name when nothing is typed', () => {
		expect(matchingTerms(terms, ' ').map((one) => one.name)).toEqual([
			'Impast',
			'Laserunek',
			'Sfumato',
			'Światłocień'
		]);
		expect(matchingTerms(terms, '', 2)).toHaveLength(2);
	});

	it('finds a term by a part of its name or a synonym, with no regard to case or accents', () => {
		expect(matchingTerms(terms, 'swiatlo').map((one) => one.id)).toEqual(['t2']);
		expect(matchingTerms(terms, 'CHIARO').map((one) => one.id)).toEqual(['t2']);
		expect(matchingTerms(terms, 'a').map((one) => one.id)).toEqual(['t3', 't4', 't1', 't2']);
		expect(matchingTerms(terms, 'la').map((one) => one.id)).toEqual(['t4']);
		expect(matchingTerms(terms, 'xyz')).toEqual([]);
	});

	it('puts the terms whose name starts with the phrase first', () => {
		expect(matchingTerms(terms, 'ma').map((one) => one.id)).toEqual(['t1']);
		expect(matchingTerms(terms, 's').map((one) => one.id)).toEqual(['t1', 't2', 't3', 't4']);
	});
});

describe('termOf', () => {
	it('finds a term by its id', () => {
		expect(termOf(terms, 't3')?.name).toBe('Impast');
		expect(termOf(terms, 'gone')).toBeUndefined();
		expect(termOf(undefined, 't3')).toBeUndefined();
	});
});
