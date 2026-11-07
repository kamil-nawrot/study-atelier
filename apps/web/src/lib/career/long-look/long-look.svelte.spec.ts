import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordLongLook } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';
import { followLongLook, LONG_LOOK_MS, watchLongLook } from './long-look.ts';

vi.mock('#lib/career/career-data/career-data.ts', () => ({ recordLongLook: vi.fn() }));
vi.mock('#lib/career/career-state/career-state.svelte.ts', () => ({
	career: { refresh: vi.fn() }
}));

let visibility: DocumentVisibilityState = 'visible';

function show(state: DocumentVisibilityState): void {
	visibility = state;
	document.dispatchEvent(new Event('visibilitychange'));
}

describe('long look', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
		visibility = 'visible';
		vi.mocked(recordLongLook).mockReset().mockResolvedValue({});
		vi.mocked(career.refresh).mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('records an hour on one artwork once and refreshes the career', async () => {
		followLongLook('a', false);
		const stop = watchLongLook(true);
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS - 1);
		expect(recordLongLook).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(recordLongLook).toHaveBeenCalledOnce();
		expect(career.refresh).toHaveBeenCalledOnce();
		stop();
		const again = watchLongLook(true);
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS);
		expect(recordLongLook).toHaveBeenCalledOnce();
		again();
	});

	it('starts again after the page was hidden or left', async () => {
		followLongLook('b', false);
		const first = watchLongLook(false);
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS / 2);
		show('hidden');
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS);
		show('visible');
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS / 2);
		first();
		const second = watchLongLook(false);
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS / 2);
		expect(recordLongLook).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS / 2);
		expect(recordLongLook).toHaveBeenCalledOnce();
		expect(career.refresh).not.toHaveBeenCalled();
		second();
	});

	it('does not watch once the hour is recorded for the learner', async () => {
		followLongLook('c', true);
		const stop = watchLongLook(true);
		await vi.advanceTimersByTimeAsync(LONG_LOOK_MS);
		expect(recordLongLook).not.toHaveBeenCalled();
		stop();
	});
});
