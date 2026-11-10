import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import NotesSection from './NotesSection.svelte';

const notes = createRawSnippet(() => ({ render: () => '<p>A study of light.</p>' }));

describe('NotesSection', () => {
	it('shows the notes open under a heading that folds them', async () => {
		render(NotesSection, { children: notes });

		await expect.element(page.getByText('A study of light.')).toBeVisible();

		await page.getByRole('heading', { name: m.common.notes }).click();

		await expect.element(page.getByText('A study of light.')).not.toBeVisible();
	});
});
