import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
import { loadItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import ReviewFlag from './ReviewFlag.svelte';

vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({ saveFlag: vi.fn() }));
vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({
	loadItemFlags: vi.fn().mockResolvedValue([]),
	deleteFlag: vi.fn()
}));
vi.mock('#lib/backroom/flag-count/flag-count.svelte.ts', () => ({
	flagCount: { refresh: vi.fn() }
}));

const save = vi.mocked(saveFlag);
const jerome = testArtwork(1, 'Saint Jerome');
const quiz = { options: [{ label: 'Caravaggio' }, { label: 'Titian' }], answer: 0 };

describe('ReviewFlag', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('flags what the question was built from and remembers the question', async () => {
		save.mockResolvedValue({ created: true });
		render(ReviewFlag, {
			step: { artwork: jerome, card: null, mode: 'quiz_author', quiz },
			chosen: 1,
			answered: true
		});

		await userEvent.click(page.getByRole('button', { name: m.backroom.flag }));
		await expect
			.element(page.getByRole('group', { name: m.backroom.groups.artwork('Saint Jerome') }))
			.toBeInTheDocument();
		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.answers }));
		await userEvent.click(page.getByRole('button', { name: m.backroom.confirm, exact: true }));

		await expect.element(page.getByText(m.backroom.flagged)).toBeInTheDocument();
		expect(save).toHaveBeenCalledWith({
			item: { kind: 'artwork', id: 'artwork-1', title: 'Saint Jerome' },
			reason: 'answers',
			comment: '',
			question: {
				mode: 'quiz_author',
				text: m.review.quiz.authorQuestion,
				answer: 'Caravaggio',
				picked: 'Titian'
			},
			holds: true
		});
	});

	it('shows the flags already set on the items of the question', async () => {
		vi.mocked(loadItemFlags).mockResolvedValueOnce([
			{
				id: 'flag-1',
				reason: 'answers',
				comment: 'Two authors fit',
				artworkId: 'artwork-1',
				termId: null,
				symbolId: null,
				imageId: null,
				pinId: null,
				imageNumber: null,
				question: null,
				holds: false,
				mode: null
			}
		]);
		render(ReviewFlag, { step: { artwork: jerome, card: null, mode: 'quiz_author', quiz } });

		await page.getByRole('button', { name: m.backroom.markedCount(1) }).click();
		await page.getByRole('radio', { name: new RegExp(m.backroom.reasons.answers) }).click();

		await expect
			.element(page.getByLabelText(m.backroom.commentLabel))
			.toHaveValue('Two authors fit');
		await expect.element(page.getByRole('button', { name: m.backroom.saveChanges })).toBeVisible();
	});

	it('skips the question when its flag holds it before the answer', async () => {
		save.mockResolvedValue({ created: true });
		const onskip = vi.fn();
		render(ReviewFlag, {
			step: { artwork: jerome, card: null, mode: 'quiz_author', quiz },
			onskip
		});

		await userEvent.click(page.getByRole('button', { name: m.backroom.flag }));
		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.answers }));
		await userEvent.click(page.getByRole('button', { name: m.backroom.confirm, exact: true }));

		await expect.element(page.getByText(m.backroom.skipped)).toBeInTheDocument();
		expect(onskip).toHaveBeenCalledOnce();
	});

	it('only holds an answered question', async () => {
		save.mockResolvedValue({ created: true });
		const onskip = vi.fn();
		render(ReviewFlag, {
			step: { artwork: jerome, card: null, mode: 'quiz_author', quiz },
			chosen: 1,
			answered: true,
			onskip
		});

		await userEvent.click(page.getByRole('button', { name: m.backroom.flag }));
		await userEvent.click(page.getByRole('radio', { name: m.backroom.reasons.answers }));
		await expect
			.element(page.getByRole('checkbox', { name: m.backroom.holdQuestion }))
			.toBeChecked();
		await userEvent.click(page.getByRole('button', { name: m.backroom.confirm, exact: true }));

		await expect.element(page.getByText(m.backroom.flagged)).toBeInTheDocument();
		expect(onskip).not.toHaveBeenCalled();
	});
});
