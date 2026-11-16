import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
import FlagDialog from './FlagDialog.svelte';

vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({ saveFlag: vi.fn() }));
vi.mock('#lib/backroom/flag-count/flag-count.svelte.ts', () => ({
	flagCount: { refresh: vi.fn() }
}));

const save = vi.mocked(saveFlag);

const artwork = {
	kind: 'artwork' as const,
	id: 'artwork-1',
	title: 'Saint Jerome',
	imageId: 'image-1'
};
const term = { kind: 'term' as const, id: 'term-1', name: 'Vanitas' };

const groups: FlagGroup[] = [
	{ item: term, reasons: ['hidden', 'answers', 'other'] },
	{ item: artwork, reasons: ['note', 'other'] }
];

function renderDialog(props: Partial<{ groups: FlagGroup[]; pins: unknown[] }> = {}): {
	onflagged: ReturnType<typeof vi.fn>;
} {
	const onflagged = vi.fn();
	render(FlagDialog, {
		open: true,
		groups,
		question: { mode: 'note_gap', text: m.review.quiz.noteQuestion, note: 12 },
		onflagged,
		...props
	} as never);
	return { onflagged };
}

function confirmButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.backroom.confirm, exact: true });
}

describe('FlagDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('groups the reasons by the items of the question', async () => {
		renderDialog();

		await expect
			.element(page.getByRole('group', { name: m.backroom.groups.term('Vanitas') }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('group', { name: m.backroom.groups.artwork('Saint Jerome') }))
			.toBeInTheDocument();
		await expect.element(confirmButton()).toBeDisabled();
	});

	it('flags the chosen item with the question and tells the parent', async () => {
		save.mockResolvedValue({ created: true });
		const { onflagged } = renderDialog();

		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.hidden }));
		await page.getByLabelText(m.backroom.commentLabel).fill('Missing the form "vanitas"');
		await userEvent.click(confirmButton());

		await expect.poll(() => onflagged.mock.calls).toEqual([[m.backroom.flagged]]);
		expect(save).toHaveBeenCalledWith({
			item: term,
			reason: 'hidden',
			comment: 'Missing the form "vanitas"',
			question: { mode: 'note_gap', text: m.review.quiz.noteQuestion, note: 12 }
		});
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('keeps one reason chosen across the groups', async () => {
		save.mockResolvedValue({ created: false });
		const { onflagged } = renderDialog();

		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.hidden }));
		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.note }));
		await expect
			.element(page.getByRole('radio', { name: m.backroom.reasons.hidden }))
			.not.toBeChecked();
		await userEvent.click(confirmButton());

		await expect.poll(() => onflagged.mock.calls).toEqual([[m.backroom.changed]]);
		expect(save).toHaveBeenCalledWith(expect.objectContaining({ item: artwork, reason: 'note' }));
	});

	it('asks for a comment with something else', async () => {
		renderDialog();

		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.other }).first());
		await userEvent.click(confirmButton());

		await expect.element(page.getByText(m.backroom.commentRequired)).toBeInTheDocument();
		expect(save).not.toHaveBeenCalled();
	});

	it('asks which pin when the pin of the view is flagged', async () => {
		save.mockResolvedValue({ created: true });
		renderDialog({
			groups: [{ item: artwork, reasons: ['image', 'pin', 'data', 'other'] }],
			pins: [
				{ id: 'pin-1', imageId: 'image-1', number: 1 },
				{ id: 'pin-2', imageId: 'image-1', number: 2, name: 'Skull' }
			]
		});

		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.pin }));
		await userEvent.click(page.getByRole('radio', { name: m.pins.marker(2, 'Skull') }));
		await userEvent.click(confirmButton());

		await expect.poll(() => save.mock.calls.length).toBe(1);
		expect(save.mock.calls[0][0].item).toEqual({
			...artwork,
			pin: { id: 'pin-2', imageId: 'image-1', x: 0, y: 0 }
		});
	});

	it('keeps the dialog open and says why when the save fails', async () => {
		save.mockResolvedValue({ error: m.common.network });
		const { onflagged } = renderDialog();

		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.note }));
		await userEvent.click(confirmButton());

		await expect.element(page.getByText(m.backroom.errorTitle)).toBeInTheDocument();
		await expect.element(page.getByText(m.common.network)).toBeInTheDocument();
		expect(onflagged).not.toHaveBeenCalled();
	});
});
