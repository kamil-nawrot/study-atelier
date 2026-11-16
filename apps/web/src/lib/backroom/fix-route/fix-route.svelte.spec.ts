import { beforeEach, describe, expect, it, vi } from 'vitest';
import { goto } from '$app/navigation';
import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import { BACKROOM_PATH, FixRoute } from './fix-route.svelte.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	deleteFlag: vi.fn().mockResolvedValue({})
}));

const entries = [
	{ key: 'a', path: '/atelier/1/edit', field: 'image' as const, note: 'Blurry' },
	{ key: 'b', path: '/atelier/2/edit', field: 'style' as const, note: 'brak stylu' }
];

describe('FixRoute', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		fixSession.clear();
	});

	it('names the buttons of the queue and goes on to the next item after a save', async () => {
		fixSession.start(entries, 0, true);
		const route = new FixRoute(() => '/atelier/1/edit');

		expect(route.labels).toEqual({ save: m.backroom.saveNext, cancel: m.backroom.finish });
		await expect(route.afterSave()).resolves.toBe(true);

		expect(goto).toHaveBeenCalledWith('/atelier/2/edit', { refreshAll: true });
	});

	it('returns to Zaplecze with the count at the end of the queue', async () => {
		fixSession.start(entries, 1, true);
		const route = new FixRoute(() => '/atelier/2/edit');

		await route.skip();

		expect(goto).toHaveBeenCalledWith(BACKROOM_PATH, {
			refreshAll: true,
			state: { backroomMessage: m.backroom.done(0) }
		});
	});

	it('leaves an editor that was not opened from Zaplecze alone', async () => {
		const route = new FixRoute(() => '/atelier/7/edit');

		expect(route.labels).toBeUndefined();
		await expect(route.afterSave()).resolves.toBe(false);
		expect(goto).not.toHaveBeenCalled();
	});
});
