import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import RankTitle from './RankTitle.svelte';

describe('RankTitle', () => {
	it('names the rank in the chosen form with the way to the next one on hover', async () => {
		render(RankTitle, { props: { points: 1846, form: 'feminine' } });

		await expect
			.element(page.getByText('Znawczyni'))
			.toHaveAttribute('title', m.career.rankTip(1846, 'Asystentka muzealna', 154));
	});

	it('has nothing to hover at the top rank', async () => {
		render(RankTitle, { props: { points: 80000, form: 'masculine' } });

		await expect.element(page.getByText('Dyrektor muzeum')).not.toHaveAttribute('title');
	});
});
