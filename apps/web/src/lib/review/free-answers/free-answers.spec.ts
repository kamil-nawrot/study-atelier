import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordFreeAnswers } from '#lib/review/review-data/review-data.ts';
import type { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import { answeredArtworks, FreeAnswers } from './free-answers.ts';

vi.mock('#lib/review/review-data/review-data.ts', () => ({ recordFreeAnswers: vi.fn() }));

const day = new Date(2026, 9, 30);

function session(ids: string[], free = true): ReviewSession {
	return {
		free,
		answers: ids.map((id) => ({ item: { artwork: { id } } }))
	} as unknown as ReviewSession;
}

describe('free answers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('counts each answered artwork once', () => {
		expect(answeredArtworks(session(['a', 'b', 'a']))).toBe(2);
	});

	it('records each newly answered artwork as soon as it is answered', () => {
		const free = new FreeAnswers();
		free.record(session(['a']), day);
		free.record(session(['a', 'a']), day);
		free.record(session(['a', 'a', 'b']), day);

		expect(vi.mocked(recordFreeAnswers).mock.calls).toEqual([
			[day, 1],
			[day, 1]
		]);
	});

	it('records nothing for a round with a plan', () => {
		new FreeAnswers().record(session(['a'], false), day);

		expect(recordFreeAnswers).not.toHaveBeenCalled();
	});
});
