import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { eraYearsText } from '#lib/catalogue/eras/eras.ts';
import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
import CardIndexEra from './CardIndexEra.svelte';

const era = {
	code: 'antiquity' as const,
	periods: [{ id: 'p-classical', name: 'Klasycyzm', count: 1, styles: [] }]
};

function folding(): TimelineFolding {
	return new TimelineFolding(() => ({ query: '', matched: [] }));
}

describe('CardIndexEra', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('names the era with a link to its page and its years', async () => {
		render(CardIndexEra, { props: { era, folding: folding() } });

		await expect.element(page.getByRole('heading', { name: m.eras.antiquity.name })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.eras.antiquity.name, exact: true }))
			.toHaveAttribute('href', '/atelier/values/era/antiquity');
		await expect.element(page.getByText(eraYearsText('antiquity'))).toBeVisible();
	});

	it('folds its periods with the chevron named by the era', async () => {
		render(CardIndexEra, { props: { era, folding: folding() } });
		const chevron = page.getByRole('button', { name: m.eras.antiquity.name });

		await expect.element(chevron).toHaveAttribute('aria-expanded', 'true');
		await expect.element(page.getByRole('link', { name: /Klasycyzm/ })).toBeVisible();
		await chevron.click();

		await expect.element(chevron).toHaveAttribute('aria-expanded', 'false');
		await expect.element(page.getByRole('link', { name: /Klasycyzm/ })).not.toBeInTheDocument();
	});

	it('says an unfolded era has no periods yet', async () => {
		render(CardIndexEra, { props: { era: { ...era, periods: [] }, folding: folding() } });

		await expect.element(page.getByText(m.cardIndex.emptyEra)).toBeVisible();
	});
});
