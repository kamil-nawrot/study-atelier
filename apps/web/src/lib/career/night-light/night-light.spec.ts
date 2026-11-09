import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordNightLight } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';
import { followNightLight, isNight, noteLightAtNight } from './night-light.ts';

vi.mock('#lib/career/career-data/career-data.ts', () => ({ recordNightLight: vi.fn() }));
vi.mock('#lib/career/career-state/career-state.svelte.ts', () => ({
	career: { refresh: vi.fn() }
}));

const night = new Date(2026, 10, 7, 23, 40);
const day = new Date(2026, 10, 7, 21, 59);

describe('night light', () => {
	beforeEach(() => {
		vi.mocked(recordNightLight).mockReset().mockResolvedValue({ recorded: true });
		vi.mocked(career.refresh).mockClear();
	});

	it('takes the hours from 22:00 to 5:59 as the night', () => {
		expect(isNight(new Date(2026, 10, 7, 22, 0))).toBe(true);
		expect(isNight(new Date(2026, 10, 7, 5, 59))).toBe(true);
		expect(isNight(new Date(2026, 10, 7, 6, 0))).toBe(false);
		expect(isNight(day)).toBe(false);
	});

	it('records the first switch at night once and refreshes the career', async () => {
		followNightLight('a', false);
		await noteLightAtNight(true, day);
		expect(recordNightLight).not.toHaveBeenCalled();
		await noteLightAtNight(true, night);
		await noteLightAtNight(true, night);
		expect(recordNightLight).toHaveBeenCalledOnce();
		expect(career.refresh).toHaveBeenCalledOnce();
	});

	it('asks nothing once the switch is recorded for the learner', async () => {
		followNightLight('b', true);
		await noteLightAtNight(true, night);
		expect(recordNightLight).not.toHaveBeenCalled();
	});

	it('tries again after a failed record and keeps the career alone when it is hidden', async () => {
		followNightLight('c', false);
		vi.mocked(recordNightLight).mockResolvedValueOnce({ recorded: false, error: 'offline' });
		await noteLightAtNight(false, night);
		await noteLightAtNight(false, night);
		expect(recordNightLight).toHaveBeenCalledTimes(2);
		expect(career.refresh).not.toHaveBeenCalled();
	});

	it('tries again when the database does not take the switch as a night one', async () => {
		followNightLight('d', false);
		vi.mocked(recordNightLight).mockResolvedValueOnce({ recorded: false });
		await noteLightAtNight(true, night);
		await noteLightAtNight(true, night);
		expect(recordNightLight).toHaveBeenCalledTimes(2);
		expect(career.refresh).toHaveBeenCalledOnce();
	});
});
