import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import KnowledgeBar from './KnowledgeBar.svelte';

describe('KnowledgeBar', () => {
	it('names each group with its number and hint', async () => {
		render(KnowledgeBar, { knowledge: { settled: 3, learning: 20, fresh: 249 } });

		await expect.element(page.getByText(m.review.knowledgeGroups.settled.label)).toBeVisible();
		await expect.element(page.getByText('249')).toBeVisible();
		await expect.element(page.getByText(m.review.knowledgeGroups.fresh.hint)).toBeVisible();
	});
});
