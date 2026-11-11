import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ChoiceTitle from './ChoiceTitle.svelte';

describe('ChoiceTitle', () => {
	it('names a section of the review start with a heading of its level', async () => {
		render(ChoiceTitle, { id: 'review-scope', text: 'What to review?', level: 3 });

		await expect
			.element(page.getByRole('heading', { level: 3, name: 'What to review?' }))
			.toHaveAttribute('id', 'review-scope');
	});

	it('is a second-level heading by default', async () => {
		render(ChoiceTitle, { id: 'review-knowledge', text: 'How well do you know it?' });

		await expect.element(page.getByRole('heading', { level: 2 })).toBeVisible();
	});
});
