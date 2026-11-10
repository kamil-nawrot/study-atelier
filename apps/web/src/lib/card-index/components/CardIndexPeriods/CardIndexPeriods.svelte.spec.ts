import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
import CardIndexPeriods from './CardIndexPeriods.svelte';

const periods = [
	{
		id: 'p-gothic',
		name: 'Gotyk',
		count: 3,
		styles: [{ id: 's-flamboyant', name: 'Gotyk płomienisty', count: 2 }]
	},
	{ id: 'p-romanesque', name: 'Romanizm', count: 5, styles: [] }
];

function folding(query = '', matched: string[] = []): TimelineFolding {
	return new TimelineFolding(() => ({ query, matched }));
}

describe('CardIndexPeriods', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('shows each period as a link with its number of artworks, folded at first', async () => {
		render(CardIndexPeriods, { props: { periods, folding: folding() } });

		await expect
			.element(page.getByRole('link', { name: m.cardIndex.openValue('Gotyk', m.atelier.count(3)) }))
			.toHaveAttribute('href', '/atelier/values/period/p-gothic');
		await expect
			.element(page.getByRole('button', { name: 'Gotyk' }))
			.toHaveAttribute('aria-expanded', 'false');
		expect(page.getByRole('button').elements()).toHaveLength(1);
	});

	it('unfolds and folds the styles of a period with its chevron', async () => {
		render(CardIndexPeriods, { props: { periods, folding: folding() } });
		const chevron = page.getByRole('button', { name: 'Gotyk' });

		await chevron.click();
		await expect.element(chevron).toHaveAttribute('aria-expanded', 'true');
		await expect.element(page.getByRole('link', { name: /Gotyk płomienisty/ })).toBeVisible();

		await chevron.click();
		await expect
			.element(page.getByRole('link', { name: /Gotyk płomienisty/ }))
			.not.toBeInTheDocument();
	});

	it('opens a period whose style matches the search', async () => {
		render(CardIndexPeriods, { props: { periods, folding: folding('płom', ['p-gothic']) } });

		await expect.element(page.getByRole('link', { name: /Gotyk płomienisty/ })).toBeVisible();
	});
});
