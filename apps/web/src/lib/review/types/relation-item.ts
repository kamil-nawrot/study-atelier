import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { Quiz } from './quiz.ts';
import type { RelationQuestion } from './relation-question.ts';

export type RelationItem = {
	mode: 'quiz_relation';
	question: RelationQuestion;
	key: string;
	author?: string;
	artwork: WallArtwork;
	quiz: Quiz;
};
