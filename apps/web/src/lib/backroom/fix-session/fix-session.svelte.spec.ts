import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteFlag, deleteItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import type { FixEntry } from '#lib/backroom/types/fix-entry.ts';
import { FixSession } from './fix-session.svelte.ts';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	deleteFlag: vi.fn().mockResolvedValue({}),
	deleteItemFlags: vi.fn().mockResolvedValue({})
}));
vi.mock('#lib/backroom/flag-count/flag-count.svelte.ts', () => ({
	flagCount: { refresh: vi.fn() }
}));

const entries: FixEntry[] = [
	{ key: 'flag:1', path: '/atelier/1/edit', field: 'image', note: 'Blurry', flagIds: ['flag-1'] },
	{ key: 'missing:2', path: '/atelier/2/edit', field: 'style', note: 'brak stylu' },
	{
		key: 'flag:3',
		path: '/atelier/glossary/t/edit',
		field: 'definition',
		note: 'Vague',
		flagIds: ['flag-3']
	}
];

describe('FixSession', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sessionStorage.clear();
	});

	it('goes through the queue, deletes the fixed flags and counts the fixed items', async () => {
		const session = new FixSession();

		expect(session.start(entries, 0, true)).toBe('/atelier/1/edit');
		expect(session.progressFor('/atelier/1/edit')).toEqual({ position: 1, total: 3 });
		await expect(session.saved('/atelier/1/edit')).resolves.toEqual({ path: '/atelier/2/edit' });
		expect(deleteFlag).toHaveBeenCalledWith('flag-1');

		expect(session.skip('/atelier/2/edit')).toEqual({ path: '/atelier/glossary/t/edit' });
		await expect(session.saved('/atelier/glossary/t/edit')).resolves.toEqual({
			done: true,
			fixed: 2,
			queue: true
		});
		expect(session.entryFor('/atelier/glossary/t/edit')).toBeUndefined();
	});

	it('keeps the queue for the page that is open after a reload', () => {
		new FixSession().start(entries, 1, true);

		const reloaded = new FixSession();

		expect(reloaded.entryFor('/atelier/2/edit')).toMatchObject({ field: 'style' });
		expect(reloaded.entryFor('/atelier/1/edit')).toBeUndefined();
	});

	it('ends a single fix after its save and ignores other pages', async () => {
		const session = new FixSession();
		session.start(entries, 1, false);

		expect(session.progressFor('/atelier/2/edit')).toBeUndefined();
		await expect(session.saved('/atelier/9/edit')).resolves.toBeUndefined();
		await expect(session.saved('/atelier/2/edit')).resolves.toEqual({
			done: true,
			fixed: 1,
			queue: false
		});
		expect(deleteFlag).not.toHaveBeenCalled();
	});

	it('withdraws every flag the item has at the save, also one brought back under a new id', async () => {
		const session = new FixSession();
		session.start([{ ...entries[0], target: { artworkId: 'a1' } }], 0, true);

		await session.saved('/atelier/1/edit');

		expect(deleteItemFlags).toHaveBeenCalledWith({ artworkId: 'a1' });
		expect(deleteFlag).not.toHaveBeenCalled();
	});

	it('stays on the item and counts nothing when its flags cannot be withdrawn', async () => {
		vi.mocked(deleteFlag).mockResolvedValueOnce({ error: 'Offline' });
		const session = new FixSession();
		session.start(entries, 0, true);

		await expect(session.saved('/atelier/1/edit')).resolves.toBeUndefined();
		expect(session.entryFor('/atelier/1/edit')).toMatchObject({ key: 'flag:1' });
	});

	it('names the next step without moving on, so a cancelled navigation keeps the queue', () => {
		const session = new FixSession();
		session.start(entries, 0, true);

		expect(session.nextStep('/atelier/1/edit')).toEqual({ path: '/atelier/2/edit' });
		expect(session.entryFor('/atelier/1/edit')).toBeDefined();
	});

	it('ends when the learner leaves for a page outside the queue', () => {
		const session = new FixSession();
		session.start(entries, 0, true);

		session.leave('/atelier/1/edit');
		session.leave('/atelier/2/edit');
		expect(session.entryFor('/atelier/1/edit')).toBeDefined();

		session.leave('/atelier/1');
		expect(session.entryFor('/atelier/1/edit')).toBeUndefined();
	});

	it('ends a single fix as soon as the learner leaves its page', () => {
		const session = new FixSession();
		session.start(entries, 0, false);

		session.leave('/atelier/2/edit');

		expect(session.entryFor('/atelier/1/edit')).toBeUndefined();
	});
});
