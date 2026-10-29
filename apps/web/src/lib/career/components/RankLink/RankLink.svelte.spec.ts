import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import RankLink from './RankLink.svelte';

describe('RankLink', () => {
	it('names the rank in the chosen form and leads to the display case', async () => {
		render(RankLink, { props: { points: 1846, form: 'feminine', isNew: false, flash: 0 } });

		const link = page.getByRole('link', { name: m.career.rankLabel('Znawczyni', 1846) });
		await expect.element(link).toHaveAttribute('href', '/atelier/display-case');
		await expect
			.element(link)
			.toHaveAttribute('title', m.career.rankTip(1846, 'Asystentka muzealna', 154));
		await expect.element(page.getByText('Znawczyni')).toBeVisible();
	});

	it('has no next rank to name at the top', async () => {
		render(RankLink, { props: { points: 80000, form: 'masculine', isNew: false, flash: 0 } });

		await expect
			.element(page.getByRole('link', { name: m.career.rankLabel('Dyrektor muzeum', 80000) }))
			.not.toHaveAttribute('title');
	});
});
