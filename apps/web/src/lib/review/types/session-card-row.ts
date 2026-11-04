export type SessionCardRow = {
	due: string;
	stability: number;
	difficulty: number;
	state: number;
	reps: number;
	lapses: number;
	scheduled_days: number;
	learning_steps: number;
	last_review: string | null;
};
