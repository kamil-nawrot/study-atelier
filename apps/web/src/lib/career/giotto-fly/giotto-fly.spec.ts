import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordGiottoFly } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';
import { FLY_CHANCE, followGiottoFly, landFly, swatGiottoFly } from './giotto-fly.ts';

vi.mock('#lib/career/career-data/career-data.ts', () => ({ recordGiottoFly: vi.fn() }));
vi.mock('#lib/career/career-state/career-state.svelte.ts', () => ({
	career: { refresh: vi.fn() }
}));

function sequence(...values: number[]): () => number {
	return () => values.shift() ?? 0;
}

describe('giotto fly', () => {
	beforeEach(() => {
		vi.mocked(recordGiottoFly).mockReset().mockResolvedValue({});
		vi.mocked(career.refresh).mockClear();
	});

	it('lands now and then somewhere inside the image', () => {
		followGiottoFly('a', false);
		expect(landFly(sequence(FLY_CHANCE))).toBeUndefined();
		expect(landFly(sequence(FLY_CHANCE / 2, 0, 1, 0.5))).toEqual({ left: 20, top: 80, turn: 180 });
	});

	it('records the swat once, refreshes the career and lands no more', async () => {
		followGiottoFly('b', false);
		await swatGiottoFly(true);
		await swatGiottoFly(true);
		expect(recordGiottoFly).toHaveBeenCalledOnce();
		expect(career.refresh).toHaveBeenCalledOnce();
		expect(landFly(sequence(0, 0.5, 0.5, 0))).toBeUndefined();
	});

	it('lands for no learner who has found the fly', async () => {
		followGiottoFly('c', true);
		expect(landFly(sequence(0, 0.5, 0.5, 0))).toBeUndefined();
		await swatGiottoFly(true);
		expect(recordGiottoFly).not.toHaveBeenCalled();
		followGiottoFly('d', false);
		followGiottoFly('d', true);
		expect(landFly(sequence(0, 0.5, 0.5, 0))).toBeUndefined();
	});

	it('tries again after a failed record and keeps the career alone when it is hidden', async () => {
		followGiottoFly('e', false);
		vi.mocked(recordGiottoFly).mockResolvedValueOnce({ error: 'offline' });
		await swatGiottoFly(false);
		expect(landFly(sequence(0, 0.5, 0.5, 0))).toBeDefined();
		await swatGiottoFly(false);
		expect(recordGiottoFly).toHaveBeenCalledTimes(2);
		expect(career.refresh).not.toHaveBeenCalled();
	});
});
