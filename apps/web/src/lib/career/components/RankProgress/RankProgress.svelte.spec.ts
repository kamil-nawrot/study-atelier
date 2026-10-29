import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import RankProgress from './RankProgress.svelte';

describe('RankProgress', () => {
	it('shows the rank and how many points of how many lead to the next one', async () => {
		render(RankProgress, { props: { points: 1846, form: 'masculine' } });

		await expect.element(page.getByText('Znawca', { exact: true })).toBeVisible();
		await expect
			.element(page.getByText(m.career.rankProgress(1846, 2000, 'Asystent muzealny')))
			.toBeVisible();
		await expect
			.element(page.getByRole('meter', { name: 'Znawca' }))
			.toHaveAttribute('aria-valuenow', '846');
	});

	it('says when the top rank is reached', async () => {
		render(RankProgress, { props: { points: 80000, form: 'feminine' } });

		await expect.element(page.getByText(m.career.rankTop(80000))).toBeVisible();
		await expect.element(page.getByRole('meter')).not.toBeInTheDocument();
	});
});
