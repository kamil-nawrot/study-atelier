import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import {
	FOLDED_ERAS_KEY,
	OPEN_PERIODS_KEY
} from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
import type { CardIndexTimeline as Timeline } from '#lib/card-index/types/card-index-timeline.ts';
import CardIndexTimeline from './CardIndexTimeline.svelte';

const timeline: Timeline = {
	eras: [
		{
			code: 'middle_ages',
			periods: [
				{
					id: 'p-gothic',
					name: 'Gotyk',
					count: 3,
					styles: [{ id: 's-flamboyant', name: 'Gotyk płomienisty', count: 2 }]
				},
				{ id: 'p-romanesque', name: 'Romanizm', count: 5, styles: [] }
			]
		},
		{
			code: 'early_modern',
			periods: [
				{
					id: 'p-baroque',
					name: 'Barok',
					count: 4,
					styles: [{ id: 's-caravaggism', name: 'Karawagizm', count: 1 }]
				}
			]
		},
		{ code: 'modern', periods: [] }
	],
	periodsWithoutEra: [
		{
			id: 'p-paris',
			name: 'Szkoła paryska',
			count: 2,
			styles: [{ id: 's-orphism', name: 'Orfizm', count: 1 }]
		}
	],
	stylesWithoutPeriod: [{ id: 's-nabis', name: 'Nabiści', count: 3 }]
};

function record(name: string, count: number): ReturnType<typeof page.getByRole> {
	return page.getByRole('link', {
		name: m.cardIndex.openValue(name, m.atelier.count(count)),
		exact: true
	});
}

function toggle(name: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name, exact: true });
}

describe('CardIndexTimeline', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('opens every era and folds every period at first', async () => {
		render(CardIndexTimeline, { props: { timeline } });

		await expect.element(toggle(m.eras.middle_ages.name)).toHaveAttribute('aria-expanded', 'true');
		await expect.element(record('Gotyk', 3)).toBeVisible();
		await expect.element(record('Romanizm', 5)).toBeVisible();
		await expect.element(toggle('Gotyk')).toHaveAttribute('aria-expanded', 'false');
		await expect.element(record('Gotyk płomienisty', 2)).not.toBeInTheDocument();
		await expect.element(toggle('Romanizm')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.cardIndex.emptyEra)).toBeVisible();
	});

	it('keeps the era name a link to its page beside the chevron that folds it', async () => {
		render(CardIndexTimeline, { props: { timeline } });

		await expect
			.element(page.getByRole('link', { name: m.eras.middle_ages.name, exact: true }))
			.toHaveAttribute('href', '/atelier/values/era/middle_ages');
		await toggle(m.eras.middle_ages.name).click();

		await expect.element(toggle(m.eras.middle_ages.name)).toHaveAttribute('aria-expanded', 'false');
		await expect.element(record('Gotyk', 3)).not.toBeInTheDocument();
		await expect.element(record('Barok', 4)).toBeVisible();
	});

	it('unfolds the styles of a period as links to their pages', async () => {
		render(CardIndexTimeline, { props: { timeline } });

		await toggle('Gotyk').click();

		await expect.element(toggle('Gotyk')).toHaveAttribute('aria-expanded', 'true');
		await expect
			.element(record('Gotyk płomienisty', 2))
			.toHaveAttribute('href', '/atelier/values/style/s-flamboyant');
		await expect
			.element(record('Gotyk', 3))
			.toHaveAttribute('href', '/atelier/values/period/p-gothic');
	});

	it('remembers the folding on the device', async () => {
		const first = await render(CardIndexTimeline, { props: { timeline } });
		await toggle(m.eras.early_modern.name).click();
		await toggle('Gotyk').click();
		first.unmount();

		expect(JSON.parse(localStorage.getItem(FOLDED_ERAS_KEY) ?? '[]')).toEqual(['early_modern']);
		expect(JSON.parse(localStorage.getItem(OPEN_PERIODS_KEY) ?? '[]')).toEqual(['p-gothic']);
		render(CardIndexTimeline, { props: { timeline } });

		await expect.element(record('Gotyk płomienisty', 2)).toBeVisible();
		await expect.element(record('Barok', 4)).not.toBeInTheDocument();
	});

	it('unfolds what holds a match while searching, without changing the remembered folding', async () => {
		localStorage.setItem(FOLDED_ERAS_KEY, JSON.stringify(['early_modern']));
		render(CardIndexTimeline, { props: { timeline } });
		const search = page.getByRole('searchbox', { name: m.cardIndex.search.timeline });
		await search.fill('karawag');

		await expect.element(record('Karawagizm', 1)).toBeVisible();
		await toggle('Barok').click();
		await expect.element(record('Karawagizm', 1)).not.toBeInTheDocument();
		await expect.element(record('Gotyk', 3)).not.toBeInTheDocument();
		expect(localStorage.getItem(OPEN_PERIODS_KEY)).toBeNull();

		await search.fill('');

		await expect.element(record('Barok', 4)).not.toBeInTheDocument();
		await expect.element(record('Gotyk', 3)).toBeVisible();
		await expect.element(record('Gotyk płomienisty', 2)).not.toBeInTheDocument();
		expect(JSON.parse(localStorage.getItem(FOLDED_ERAS_KEY) ?? '[]')).toEqual(['early_modern']);
	});

	it('shows the periods without an era and the styles without a period after the eras', async () => {
		render(CardIndexTimeline, { props: { timeline } });

		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.periodsWithoutEra }))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.stylesWithoutPeriod }))
			.toBeVisible();
		await expect.element(record('Nabiści', 3)).toBeVisible();
		await expect.element(record('Orfizm', 1)).not.toBeInTheDocument();

		await toggle('Szkoła paryska').click();

		await expect.element(record('Orfizm', 1)).toBeVisible();
		expect(document.querySelector('.outside.divided')).not.toBeNull();
	});

	it('says when nothing matches the search', async () => {
		render(CardIndexTimeline, { props: { timeline, query: 'xyz' } });

		await expect.element(page.getByText(m.cardIndex.noResults('xyz'))).toBeVisible();
		await expect.element(record('Gotyk', 3)).not.toBeInTheDocument();
	});
});
