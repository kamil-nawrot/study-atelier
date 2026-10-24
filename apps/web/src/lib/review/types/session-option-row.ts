import type { QuizReason } from './quiz-reason.ts';

export type SessionOptionRow = {
	artwork_id?: string;
	label: string;
	reason?: QuizReason;
	right?: boolean;
};
