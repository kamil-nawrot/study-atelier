import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

export const SHOWN_TERMS = 6;

function folded(text: string): string {
	return text.toLocaleLowerCase('pl').replaceAll('ł', 'l').normalize('NFD').replace(/\p{M}/gu, '');
}

export function matchingTerms(
	terms: readonly GlossaryTerm[],
	query: string,
	limit = SHOWN_TERMS
): GlossaryTerm[] {
	const phrase = folded(query.trim());
	const sorted = [...terms].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
	if (phrase === '') return sorted.slice(0, limit);
	const starts = (term: GlossaryTerm): boolean => folded(term.name).startsWith(phrase);
	return sorted
		.filter((term) => [term.name, ...term.synonyms].some((name) => folded(name).includes(phrase)))
		.sort((a, b) => Number(starts(b)) - Number(starts(a)))
		.slice(0, limit);
}

export function termOf(
	terms: readonly GlossaryTerm[] | undefined,
	id: unknown
): GlossaryTerm | undefined {
	return terms?.find((term) => term.id === id);
}
