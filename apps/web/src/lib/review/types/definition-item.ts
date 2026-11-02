import type { DefinedTerm } from './defined-term.ts';
import type { Quiz } from './quiz.ts';

export type DefinitionItem = {
	mode: 'quiz_definition';
	term: DefinedTerm;
	quiz: Quiz;
};
