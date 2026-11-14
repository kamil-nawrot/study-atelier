import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	AUTOSAVE_DELAY_MS,
	ExhibitionSession,
	RETRY_DELAY_MS
} from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';
import { saveExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import type { Exhibition } from '#lib/exhibitions/types/exhibition.ts';

vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	saveExhibition: vi.fn()
}));

const exhibition: Exhibition = {
	id: 'exhibition-1',
	title: 'Light',
	document: { type: 'doc', content: [] },
	revision: 3,
	updatedAt: '2026-11-06T10:00:00Z'
};

const changed = { type: 'doc', content: [{ type: 'textBlock' }] };

describe('ExhibitionSession', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		vi.mocked(saveExhibition).mockReset();
		vi.mocked(saveExhibition).mockResolvedValue({ revision: 4 });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('starts saved', () => {
		const session = new ExhibitionSession(exhibition);
		expect(session.status).toBe('saved');
		expect(session.title).toBe('Light');
	});

	it('saves a few seconds after the last change and then says it is saved', async () => {
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		expect(session.status).toBe('saving');
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1);
		expect(saveExhibition).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(saveExhibition).toHaveBeenCalledWith('exhibition-1', 'Light', changed, 3);
		expect(session.status).toBe('saved');
	});

	it('waits again when the learner keeps changing the exhibition', async () => {
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1);
		session.rename('Dark');
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1);
		expect(saveExhibition).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(saveExhibition).toHaveBeenCalledWith('exhibition-1', 'Dark', changed, 3);
	});

	it('does not save a blank title and says why', async () => {
		const session = new ExhibitionSession(exhibition);
		session.rename('   ');
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

		expect(saveExhibition).not.toHaveBeenCalled();
		expect(session.status).toBe('untitled');
		await session.flush();
		expect(saveExhibition).not.toHaveBeenCalled();
	});

	it('keeps the last title once the learner leaves the field blank', async () => {
		const session = new ExhibitionSession(exhibition);
		session.rename('Dark');
		session.rename('');
		session.keepTitle();

		expect(session.title).toBe('Dark');
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		expect(saveExhibition).toHaveBeenCalledWith('exhibition-1', 'Dark', exhibition.document, 3);
	});

	it('leaves a filled title as it is when the field loses focus', () => {
		const session = new ExhibitionSession(exhibition);
		session.rename('Dark');
		session.keepTitle();

		expect(session.title).toBe('Dark');
	});

	it('does not schedule a save for a document change while the title is blank', async () => {
		const session = new ExhibitionSession(exhibition);
		session.rename('');
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);

		expect(saveExhibition).not.toHaveBeenCalled();
		expect(session.status).toBe('untitled');
	});

	it('sends the revision it got from the last save with the next one', async () => {
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		session.rename('Dark');
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		expect(saveExhibition).toHaveBeenLastCalledWith('exhibition-1', 'Dark', changed, 4);
	});

	it('saves again after a save that was running while the learner changed something', async () => {
		let finish: (revision: number) => void = () => {};
		vi.mocked(saveExhibition).mockImplementationOnce(
			() => new Promise((resolve) => (finish = (revision) => resolve({ revision })))
		);
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		session.rename('Dark');
		finish(4);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		expect(saveExhibition).toHaveBeenCalledTimes(2);
		expect(saveExhibition).toHaveBeenLastCalledWith('exhibition-1', 'Dark', changed, 4);
		expect(session.status).toBe('saved');
	});

	it('waits for a running save and then saves what changed meanwhile when the learner leaves', async () => {
		let finish: (revision: number) => void = () => {};
		vi.mocked(saveExhibition).mockImplementationOnce(
			() => new Promise((resolve) => (finish = (revision) => resolve({ revision })))
		);
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		session.rename('Dark');
		const flushed = session.flush();
		session.destroy();
		finish(4);
		await flushed;
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 2);

		expect(saveExhibition).toHaveBeenCalledTimes(2);
		expect(saveExhibition).toHaveBeenLastCalledWith('exhibition-1', 'Dark', changed, 4);
		expect(session.dirty).toBe(false);
		expect(session.status).toBe('saved');
	});

	it('still saves what changed during a running save when the session is destroyed without a flush', async () => {
		let finish: (revision: number) => void = () => {};
		vi.mocked(saveExhibition).mockImplementationOnce(
			() => new Promise((resolve) => (finish = (revision) => resolve({ revision })))
		);
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		session.rename('Dark');
		session.destroy();
		finish(4);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 2);

		expect(saveExhibition).toHaveBeenCalledTimes(2);
		expect(saveExhibition).toHaveBeenLastCalledWith('exhibition-1', 'Dark', changed, 4);
	});

	it('flushes at once when the learner leaves edit mode', async () => {
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await session.flush();
		expect(saveExhibition).toHaveBeenCalledTimes(1);
		expect(session.status).toBe('saved');
	});

	it('does not save when nothing changed', async () => {
		const session = new ExhibitionSession(exhibition);
		await session.flush();
		expect(saveExhibition).not.toHaveBeenCalled();
	});

	it('reports a failed save and tries again later', async () => {
		vi.mocked(saveExhibition).mockResolvedValueOnce({ error: 'Offline' });
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		expect(session.status).toBe('failed');
		expect(session.error).toBe('Offline');
		await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
		expect(saveExhibition).toHaveBeenCalledTimes(2);
		expect(session.status).toBe('saved');
		expect(session.error).toBeUndefined();
	});

	it('does not try again a save the database refused, until the next change', async () => {
		vi.mocked(saveExhibition).mockResolvedValueOnce({ error: 'Archived', rejected: true });
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		expect(session.status).toBe('rejected');
		expect(session.error).toBe('Archived');
		expect(session.unsaved).toBe(true);
		await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 3);
		expect(saveExhibition).toHaveBeenCalledTimes(1);

		session.rename('Dark');
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		expect(saveExhibition).toHaveBeenCalledTimes(2);
		expect(session.status).toBe('saved');
		expect(session.unsaved).toBe(false);
	});

	it('tries no more once destroyed, even after a save that was running fails', async () => {
		let fail: () => void = () => {};
		vi.mocked(saveExhibition).mockImplementationOnce(
			() => new Promise((resolve) => (fail = () => resolve({ error: 'Offline' })))
		);
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		session.destroy();
		fail();
		await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 3);

		expect(saveExhibition).toHaveBeenCalledTimes(1);
		expect(session.status).toBe('failed');
		expect(session.unsaved).toBe(true);
	});

	it('stops saving after a newer version from another window refused the save', async () => {
		vi.mocked(saveExhibition).mockResolvedValueOnce({ conflict: true });
		const session = new ExhibitionSession(exhibition);
		session.replace(changed);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS);
		expect(session.status).toBe('conflict');
		session.rename('Dark');
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS * 3);
		expect(saveExhibition).toHaveBeenCalledTimes(1);
		expect(session.status).toBe('conflict');
	});
});
