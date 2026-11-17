import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordExtraReview } from '#lib/review/extra-cards-data/extra-cards-data.ts';
import { recordPairAnswer } from '#lib/review/review-data/review-data.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import { recordExtraAnswer } from './extra-answers.ts';

vi.mock('#lib/review/extra-cards-data/extra-cards-data.ts', () => ({
	recordExtraReview: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('#lib/review/review-data/review-data.ts', () => ({
	recordPairAnswer: vi.fn().mockResolvedValue(undefined)
}));

const now = new Date('2026-11-16T15:00:00');
const quiz = { answer: 0, options: [{ label: 'Apse' }] };
const card: ExtraCard = {
	id: 'card-1',
	termId: null,
	symbolId: 'symbol-1',
	eventId: null,
	due: new Date('2026-11-15T08:00:00'),
	stability: 4,
	difficulty: 5,
	state: 2,
	reps: 2,
	lapses: 0,
	scheduledDays: 4,
	learningSteps: 0,
	lastReview: new Date('2026-11-11T08:00:00'),
	lastRating: 2
};

describe('recordExtraAnswer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('schedules a new term from an empty card', async () => {
		await recordExtraAnswer(
			{
				mode: 'quiz_definition',
				term: {
					id: 'term-1',
					name: 'Apse',
					category: 'architecture',
					definition: 'A recess.',
					synonyms: [],
					forms: [],
					hasDefinition: true
				},
				quiz
			},
			true,
			now,
			now.getTime() - 1500
		);

		expect(recordExtraReview).toHaveBeenCalledWith(
			{ termId: 'term-1' },
			expect.objectContaining({ reps: 1, lastRating: 2 }),
			{ correct: true, answerMs: 1500, mode: 'quiz_definition' },
			now
		);
	});

	it('schedules a symbol from its card by the kind of its question', async () => {
		await recordExtraAnswer(
			{
				mode: 'quiz_symbol',
				kind: 'attribute',
				symbol: { id: 'symbol-1', name: 'Keys' },
				card,
				key: 'pin-1:attribute',
				quiz
			},
			false,
			now,
			now.getTime(),
			'Paul'
		);

		expect(recordExtraReview).toHaveBeenCalledWith(
			{ symbolId: 'symbol-1' },
			expect.objectContaining({ lapses: 1, lastRating: 1 }),
			{ correct: false, answerMs: 0, wrongAnswer: 'Paul', mode: 'symbol_attribute' },
			now
		);
	});

	it('logs a pair answer as before and nothing for a note gap', async () => {
		const pair = {
			mode: 'quiz_pair' as const,
			kind: 'author' as const,
			key: 'k',
			asked: 'Caravaggio',
			other: 'Titian',
			quiz
		};
		await recordExtraAnswer(pair, true, now, now.getTime());
		expect(recordPairAnswer).toHaveBeenCalledWith(pair, true);
		expect(recordExtraReview).not.toHaveBeenCalled();
	});
});
