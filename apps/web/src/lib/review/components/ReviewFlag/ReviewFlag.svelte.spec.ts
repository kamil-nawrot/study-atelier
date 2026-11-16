import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { saveFlag } from '#lib/backroom/flags-data/flags-data.ts';
import ReviewFlag from './ReviewFlag.svelte';

vi.mock('#lib/backroom/flags-data/flags-data.ts', () => ({ saveFlag: vi.fn() }));

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
			chosen: 1
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
			}
		});
	});
});
