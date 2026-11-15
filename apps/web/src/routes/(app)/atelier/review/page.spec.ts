import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { loadReviewCounts } from '#lib/review/review-data/review-data.ts';
import { loadReviewPlan } from '#lib/review/review-plan-data/review-plan-data.ts';
import { load } from './+page';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	loadAtelier: vi.fn(async () => ({ artworks: [] }))
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({
	loadTermIndex: vi.fn(async () => ({ terms: [] }))
}));
vi.mock('#lib/pins/pin-data/pin-data.ts', () => ({ countTermPins: vi.fn(async () => new Map()) }));
vi.mock('#lib/review/review-data/review-data.ts', () => ({
	loadReviewCards: vi.fn(async () => ({ cards: new Map(), styleCards: new Map() })),
	loadReviewCounts: vi.fn(),
	loadReviewStreak: vi.fn(async () => ({ days: 2 }))
}));
vi.mock('#lib/review/review-plan-data/review-plan-data.ts', () => ({ loadReviewPlan: vi.fn() }));

type LoadEvent = Parameters<typeof load>[0];

const plan = { scopes: [], free: [], tomorrow: 4 };

function loadWith(preferences?: typeof defaultPreferences): ReturnType<typeof load> {
	return load({
		parent: async () => ({ preferences }),
		untrack: <T>(read: () => T) => read()
	} as unknown as LoadEvent);
}

describe('review load', () => {
	beforeEach(() => {
		vi.mocked(loadReviewCounts).mockResolvedValue({ counts: { newToday: 3, waiting: 12 } });
		vi.mocked(loadReviewPlan).mockReset().mockResolvedValue({ plan });
	});

	it('reads the plan of the review start in the preferred form', async () => {
		const data = await loadWith({ ...defaultPreferences, reviewForm: 'quizzes' });

		expect(vi.mocked(loadReviewPlan).mock.calls[0]?.[1]).toBe('quizzes');
		expect(data).toMatchObject({ plan, newToday: 3, waiting: 12, streak: 2, error: undefined });
	});

	it('plans a mixed round and passes the error on when the plan cannot be read', async () => {
		vi.mocked(loadReviewCounts).mockResolvedValue({ error: 'Failed' } as never);
		vi.mocked(loadReviewPlan).mockResolvedValue({ error: 'Plan failed' });

		const data = await loadWith(undefined);

		expect(vi.mocked(loadReviewPlan).mock.calls[0]?.[1]).toBe(defaultPreferences.reviewForm);
		expect(data).toMatchObject({
			newToday: 0,
			waiting: undefined,
			plan: undefined,
			error: 'Failed'
		});
	});
});
