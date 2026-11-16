import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { deleteFlag, loadItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import ItemFlagDialog from './ItemFlagDialog.svelte';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	loadItemFlags: vi.fn(),
	deleteFlag: vi.fn()
}));
vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({ saveFlag: vi.fn() }));
vi.mock('#lib/backroom/flag-count/flag-count.svelte.ts', () => ({
	flagCount: { refresh: vi.fn() }
}));

const term = { kind: 'term' as const, id: 'term-1', name: 'Vanitas' };
const stored = {
	id: 'flag-1',
	reason: 'definition' as const,
	comment: 'Too long',
	artworkId: null,
	termId: 'term-1',
	symbolId: null,
	imageId: null,
	pinId: null
};

function renderDialog(): {
	oncount: ReturnType<typeof vi.fn>;
	onflagged: ReturnType<typeof vi.fn>;
} {
	const oncount = vi.fn();
	const onflagged = vi.fn();
	render(ItemFlagDialog, {
		open: true,
		flagsOf: { termId: 'term-1' },
		groups: [{ item: term, reasons: ['hidden', 'definition', 'other'] }],
		onflagged,
		oncount
	});
	return { oncount, onflagged };
}

describe('ItemFlagDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('marks a flagged reason, fills its comment and saves the change', async () => {
		vi.mocked(loadItemFlags).mockResolvedValue([stored]);
		vi.mocked(saveFlag).mockResolvedValue({ created: false });
		const { oncount, onflagged } = renderDialog();

		await expect.poll(() => oncount.mock.lastCall?.[0]).toBe(1);
		expect(loadItemFlags).toHaveBeenCalledWith({ termId: 'term-1' });
		await expect.element(page.getByText(m.backroom.marked)).toBeVisible();
		await userEvent.click(
			page.getByRole('radio', { name: new RegExp(m.backroom.reasons.definition) })
		);
		await expect.element(page.getByLabelText(m.backroom.commentLabel)).toHaveValue('Too long');
		await userEvent.click(page.getByRole('button', { name: m.backroom.saveChanges }));

		await expect.poll(() => onflagged.mock.calls).toEqual([[m.backroom.changed]]);
		expect(loadItemFlags).toHaveBeenCalledTimes(2);
	});

	it('withdraws a flag and loads the flags again', async () => {
		vi.mocked(loadItemFlags).mockResolvedValueOnce([stored]).mockResolvedValueOnce([]);
		vi.mocked(deleteFlag).mockResolvedValue({});
		const { oncount, onflagged } = renderDialog();

		await expect.poll(() => oncount.mock.lastCall?.[0]).toBe(1);
		await userEvent.click(
			page.getByRole('radio', { name: new RegExp(m.backroom.reasons.definition) })
		);
		await userEvent.click(page.getByRole('button', { name: m.backroom.withdraw }));

		await expect.poll(() => onflagged.mock.calls).toEqual([[m.backroom.withdrawn]]);
		expect(deleteFlag).toHaveBeenCalledWith('flag-1');
		await expect.poll(() => oncount.mock.lastCall?.[0]).toBe(0);
	});

	it('offers no withdrawal for a reason not flagged and clears a filled comment', async () => {
		vi.mocked(loadItemFlags).mockResolvedValue([stored]);
		renderDialog();

		await userEvent.click(
			page.getByRole('radio', { name: new RegExp(m.backroom.reasons.definition) })
		);
		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.hidden }));

		await expect.element(page.getByLabelText(m.backroom.commentLabel)).toHaveValue('');
		await expect
			.element(page.getByRole('button', { name: m.backroom.withdraw }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.backroom.confirm, exact: true }))
			.toBeVisible();
	});
});
