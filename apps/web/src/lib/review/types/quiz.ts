import type { QuizOption } from './quiz-option.ts';

export type Quiz = {
	options: QuizOption[];
	answer: number;
};
