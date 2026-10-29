import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheForLearner, cached, forgetCached, watchCache } from './data-cache.ts';

const page = Object.assign(new EventTarget(), { visibilityState: 'visible' });

function hide(hidden: boolean): void {
	page.visibilityState = hidden ? 'hidden' : 'visible';
	page.dispatchEvent(new Event('visibilitychange'));
}

describe('cached', () => {
	beforeEach(() => {
		cacheForLearner('learner-a');
		forgetCached();
	});

	it('loads once and gives the same answer again', async () => {
		const load = vi.fn().mockResolvedValue({ rows: [1] });

		await cached('atelier', load);
		await expect(cached('atelier', load)).resolves.toEqual({ rows: [1] });

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('shares one load between calls made at the same time', async () => {
		const load = vi.fn().mockResolvedValue({ rows: [] });

		await Promise.all([cached('atelier', load), cached('atelier', load)]);

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('keeps no failed answer', async () => {
		const load = vi
			.fn()
			.mockResolvedValueOnce({ error: 'Brak sieci.' })
			.mockResolvedValueOnce({ rows: [1] });

		await cached('atelier', load);
		await expect(cached('atelier', load)).resolves.toEqual({ rows: [1] });
	});

	it('keeps no load that threw', async () => {
		const load = vi
			.fn()
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce({ rows: [1] });

		await expect(cached('atelier', load)).rejects.toThrow('boom');
		await expect(cached('atelier', load)).resolves.toEqual({ rows: [1] });
	});

	it('loads again after a write', async () => {
		const load = vi.fn().mockResolvedValue({ rows: [] });

		await cached('atelier', load);
		forgetCached();
		await cached('atelier', load);

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('keeps what was loaded before the first learner is known', async () => {
		cacheForLearner(undefined);
		forgetCached();
		const load = vi.fn().mockResolvedValue({ rows: [] });

		await cached('atelier', load);
		cacheForLearner('learner-a');
		await cached('atelier', load);

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('never gives one learner the answer loaded for another', async () => {
		cacheForLearner('learner-a');
		forgetCached();
		let finish: (value: { rows: string[] }) => void = () => {};
		const slow = cached(
			'atelier',
			() => new Promise<{ rows: string[] }>((done) => (finish = done))
		);
		cacheForLearner(undefined);
		cacheForLearner('learner-b');
		const load = vi.fn().mockResolvedValue({ rows: ['b'] });

		finish({ rows: ['a'] });
		await slow;

		await expect(cached('atelier', load)).resolves.toEqual({ rows: ['b'] });
	});

	it('loads again for another learner, not for the same one', async () => {
		const load = vi.fn().mockResolvedValue({ rows: [] });

		await cached('atelier', load);
		cacheForLearner('learner-a');
		await cached('atelier', load);
		cacheForLearner('learner-b');
		await cached('atelier', load);

		expect(load).toHaveBeenCalledTimes(2);
	});
});

describe('watchCache', () => {
	let now = 0;
	let stop: () => void;

	beforeEach(() => {
		cacheForLearner('learner-a');
		forgetCached();
		now = 0;
		vi.stubGlobal('document', page);
		stop = watchCache(() => now);
	});

	afterEach(() => {
		stop();
		page.visibilityState = 'visible';
		vi.unstubAllGlobals();
	});

	it('keeps the answers after a short time in another tab', async () => {
		const load = vi.fn().mockResolvedValue({ rows: [] });
		await cached('atelier', load);

		hide(true);
		now = 9 * 60 * 1000;
		hide(false);
		await cached('atelier', load);

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('forgets the answers after more than ten minutes hidden', async () => {
		const load = vi.fn().mockResolvedValue({ rows: [] });
		await cached('atelier', load);

		hide(true);
		now = 11 * 60 * 1000;
		hide(false);
		await cached('atelier', load);

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('forgets the answers when another tab writes', async () => {
		const load = vi.fn().mockResolvedValue({ rows: [] });
		await cached('atelier', load);
		const other = new BroadcastChannel('study-atelier:data-cache');

		other.postMessage('forget');
		await vi.waitFor(async () => {
			await cached('atelier', load);
			expect(load).toHaveBeenCalledTimes(2);
		});
		other.close();
	});
});
