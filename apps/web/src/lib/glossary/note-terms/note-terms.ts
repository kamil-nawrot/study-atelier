import type { NoteTerm } from '@study-atelier/ui';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

export function noteTermsOf(terms: readonly GlossaryTerm[]): NoteTerm[] {
	return terms.map((term) => ({
		id: term.id,
		phrases: [term.name, ...term.synonyms, ...term.forms]
	}));
}
