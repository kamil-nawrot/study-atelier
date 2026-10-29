import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { Quiz } from './quiz.ts';

export type DefinitionItem = {
	mode: 'quiz_definition';
	term: GlossaryEntry;
	quiz: Quiz;
};
