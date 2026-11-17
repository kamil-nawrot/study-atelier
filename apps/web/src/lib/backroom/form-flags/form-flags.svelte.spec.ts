import { flushSync, tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteFlag, loadItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import { restoreFlag } from '#lib/backroom/flags-data/flags-data.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import { m } from '#lib/i18n/i18n.ts';
import { FormFlags } from './form-flags.svelte.ts';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	loadItemFlags: vi.fn(),
	deleteFlag: vi.fn(),
	countFlags: vi.fn().mockResolvedValue(0)
}));
vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({ restoreFlag: vi.fn() }));

const flag = (id: string, extra: Partial<StoredFlag> = {}): StoredFlag => ({
	id,
	reason: 'definition',
	comment: null,
	artworkId: null,
	termId: 't1',
	symbolId: null,
	eventId: null,
	imageId: null,
	pinId: null,
	imageNumber: null,
	question: null,
	holds: false,
	mode: null,
	...extra
});

async function formFlags(): Promise<{ flags: FormFlags; stop: () => void }> {
	let flags: FormFlags | undefined;
	const stop = $effect.root(() => {
		flags = new FormFlags('term', () => ({ termId: 't1' }));
	});
	flushSync();
	await vi.waitFor(() => expect(loadItemFlags).toHaveBeenCalled());
	await tick();
	return { flags: flags as FormFlags, stop };
}

describe('FormFlags', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('gives each field the notes of its flags', async () => {
		vi.mocked(loadItemFlags).mockResolvedValue([
			flag('f1', { comment: 'Za krótka' }),
			flag('f2', { reason: 'hidden' })
		]);
		const { flags, stop } = await formFlags();

		await vi.waitFor(() => expect(flags.notes('definition')).toHaveLength(1));
		expect(flags.notes('definition')[0]).toEqual({
			id: 'f1',
			text: m.backroom.note(m.backroom.reasons.definition, 'Za krótka'),
			fixed: false
		});
		expect(flags.notes('forms').map((note) => note.id)).toEqual(['f2']);
		expect(loadItemFlags).toHaveBeenCalledWith({ termId: 't1' });
		stop();
	});

	it('marks a flag as fixed and brings it back', async () => {
		vi.mocked(loadItemFlags)
			.mockResolvedValueOnce([flag('f1')])
			.mockResolvedValueOnce([flag('f9')]);
		vi.mocked(deleteFlag).mockResolvedValue({});
		vi.mocked(restoreFlag).mockResolvedValue({});
		const { flags, stop } = await formFlags();
		await vi.waitFor(() => expect(flags.notes('definition')).toHaveLength(1));

		await flags.markFixed('f1');
		expect(deleteFlag).toHaveBeenCalledWith('f1');
		expect(flags.notes('definition')).toEqual([expect.objectContaining({ id: 'f1', fixed: true })]);

		await flags.undo('f1');
		expect(restoreFlag).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1', termId: 't1' }));
		expect(flags.notes('definition')).toEqual([
			expect.objectContaining({ id: 'f9', fixed: false })
		]);
		stop();
	});

	it('keeps the flag and says why when it cannot be marked', async () => {
		vi.mocked(loadItemFlags).mockResolvedValue([flag('f1')]);
		vi.mocked(deleteFlag).mockResolvedValue({ error: m.common.network });
		const { flags, stop } = await formFlags();
		await vi.waitFor(() => expect(flags.notes('definition')).toHaveLength(1));

		await flags.markFixed('f1');

		expect(flags.failed).toEqual({ id: 'f1', text: m.common.network });
		expect(flags.notes('definition')[0].fixed).toBe(false);
		stop();
	});
});
