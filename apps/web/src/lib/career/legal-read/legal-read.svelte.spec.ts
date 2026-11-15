import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordLegalRead } from '#lib/career/career-data/career-data.ts';
import { career } from '#lib/career/career-state/career-state.svelte.ts';
import { LEGAL_READ_MS, watchLegalRead } from './legal-read.ts';

vi.mock('#lib/career/career-data/career-data.ts', () => ({ recordLegalRead: vi.fn() }));
vi.mock('#lib/career/career-state/career-state.svelte.ts', () => ({
	career: { noteWrite: vi.fn() }
}));

let visibility: DocumentVisibilityState = 'visible';
const watchers: IntersectionObserverCallback[] = [];

function show(state: DocumentVisibilityState): void {
	visibility = state;
	document.dispatchEvent(new Event('visibilitychange'));
}

function scroll(inView: boolean): void {
	for (const callback of watchers) {
		callback([{ isIntersecting: inView } as IntersectionObserverEntry], {} as never);
	}
}

describe('legal read', () => {
	const end = document.createElement('div');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
		visibility = 'visible';
		watchers.length = 0;
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(callback: IntersectionObserverCallback) {
					watchers.push(callback);
				}
				observe(): void {}
				disconnect(): void {}
			}
		);
		vi.mocked(recordLegalRead).mockReset().mockResolvedValue({});
		vi.mocked(career.noteWrite).mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('does not count the end reached before the time is up', async () => {
		const stop = watchLegalRead('a', end);
		scroll(true);
		scroll(false);
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS);
		expect(recordLegalRead).not.toHaveBeenCalled();
		scroll(true);
		await vi.advanceTimersByTimeAsync(0);
		expect(recordLegalRead).toHaveBeenCalledOnce();
		expect(career.noteWrite).toHaveBeenCalledOnce();
		stop();
	});

	it('counts the end still in view when the time is up, and only once', async () => {
		const stop = watchLegalRead('b', end);
		scroll(true);
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS);
		expect(recordLegalRead).toHaveBeenCalledOnce();
		stop();
		const again = watchLegalRead('b', end);
		scroll(true);
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS);
		expect(recordLegalRead).toHaveBeenCalledOnce();
		again();
	});

	it('starts the time again after the page was hidden', async () => {
		const stop = watchLegalRead('c', end);
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS / 2);
		show('hidden');
		show('visible');
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS / 2);
		scroll(true);
		await vi.advanceTimersByTimeAsync(0);
		expect(recordLegalRead).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS / 2);
		expect(recordLegalRead).toHaveBeenCalledOnce();
		stop();
	});

	it('watches no visitor without an account and tries again after a failed record', async () => {
		const guest = watchLegalRead(undefined, end);
		expect(watchers).toHaveLength(0);
		guest();
		vi.mocked(recordLegalRead).mockResolvedValueOnce({ error: 'offline' });
		const first = watchLegalRead('d', end);
		scroll(true);
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS);
		expect(career.noteWrite).not.toHaveBeenCalled();
		first();
		const second = watchLegalRead('d', end);
		scroll(true);
		await vi.advanceTimersByTimeAsync(LEGAL_READ_MS);
		expect(recordLegalRead).toHaveBeenCalledTimes(2);
		expect(career.noteWrite).toHaveBeenCalledOnce();
		second();
	});
});
