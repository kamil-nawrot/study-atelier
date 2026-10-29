import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';
import ExhibitCase from './ExhibitCase.svelte';

const unlocked = (tier: number, seen = true): UnlockedTier => ({
	exhibit: 'collection',
	tier,
	unlockedAt: new Date(2026, 9, tier),
	seenAt: seen ? new Date(2026, 9, 20) : undefined
});

function exhibit(overrides: Partial<Exhibit> = {}): Exhibit {
	return {
		code: 'collection',
		value: 24,
		thresholds: [1, 10, 50, 100, 250],
		tiers: [unlocked(1), unlocked(2)],
		...overrides
	};
}

describe('ExhibitCase', () => {
	it('names the exhibit, says what it counts and how far the next tier is', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit() } });

		await expect
			.element(page.getByRole('heading', { level: 3 }))
			.toHaveTextContent(m.career.exhibits.collection.name);
		await expect.element(page.getByText(m.career.exhibits.collection.about)).toBeVisible();
		await expect.element(page.getByText(m.career.tier('II', 'V'))).toBeVisible();
		await expect.element(page.getByText(m.career.progress(24, 50))).toBeVisible();
		await expect
			.element(page.getByRole('meter', { name: m.career.exhibits.collection.name }))
			.toHaveAttribute('aria-valuemax', '50');
	});

	it('marks a tier not seen yet as new', async () => {
		render(ExhibitCase, {
			props: { exhibit: exhibit({ tiers: [unlocked(1), unlocked(2, false)] }) }
		});

		await expect.element(page.getByText(m.career.new)).toBeVisible();
	});

	it('lists the dates of the unlocked tiers', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit() } });

		await page.getByText(m.career.tiers).click();
		await expect
			.element(page.getByText(m.career.tierDate('II', '2 października 2026')))
			.toBeVisible();
	});

	it('reveals the curiosity of each unlocked tier with its source', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit() } });

		await page.getByText(m.career.tiers).click();
		await expect.element(page.getByText(m.career.curiosities.collection[1])).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.career.source }).nth(1))
			.toHaveAttribute('href', 'https://www.savevenice.org/project/jacopo-tintoretto-paradise');
	});

	it('says that the exhibit has no tier yet', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit({ value: 0, tiers: [] }) } });

		await expect.element(page.getByText(m.career.noTier)).toBeVisible();
		await expect.element(page.getByText(m.career.tiers)).not.toBeInTheDocument();
	});

	it('says when the top tier is reached', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit({ value: 300 }) } });

		await expect.element(page.getByText(m.career.top)).toBeVisible();
		await expect.element(page.getByRole('meter')).not.toBeInTheDocument();
	});

	it('keeps an easter egg hidden behind a hint until it is found', async () => {
		render(ExhibitCase, {
			props: { exhibit: exhibit({ code: 'night_watch', value: 0, thresholds: [1], tiers: [] }) }
		});

		await expect
			.element(page.getByRole('heading', { level: 3 }))
			.toHaveTextContent(m.career.hiddenName);
		await expect.element(page.getByText(m.career.exhibits.night_watch.hint)).toBeVisible();
		await expect
			.element(page.getByText(m.career.exhibits.night_watch.name))
			.not.toBeInTheDocument();
		await expect.element(page.getByRole('meter')).not.toBeInTheDocument();
	});
});
