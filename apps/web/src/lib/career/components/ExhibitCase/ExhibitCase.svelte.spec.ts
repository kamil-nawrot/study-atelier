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
	it('names the exhibit and says how far the next tier is', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit() } });

		await expect
			.element(page.getByRole('heading', { level: 3 }))
			.toHaveTextContent(m.career.exhibits.collection.name);
		await expect.element(page.getByText(m.career.tier('II', 'V'))).toBeVisible();
		await expect.element(page.getByText(m.career.exhibits.collection.count(24, 50))).toBeVisible();
		await expect
			.element(page.getByRole('meter', { name: m.career.exhibits.collection.name }))
			.toHaveAttribute('aria-valuemax', '50');
	});

	it('keeps the description behind the button in the corner', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit() } });

		const about = page.getByText(m.career.exhibits.collection.about);
		await expect.element(about).not.toBeVisible();
		await page.getByRole('button', { name: m.career.about }).click();
		await expect.element(about).toBeVisible();
		await expect.element(page.getByText(m.career.curiosities.collection[1])).not.toBeVisible();
	});

	it('marks a tier not seen yet as new', async () => {
		render(ExhibitCase, {
			props: { exhibit: exhibit({ tiers: [unlocked(1), unlocked(2, false)] }) }
		});

		await expect.element(page.getByText(m.career.new)).toBeVisible();
	});

	it('says that the exhibit has no tier yet', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit({ value: 0, tiers: [] }) } });

		await expect.element(page.getByText(m.career.noTier)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.career.tierLabel('I') }))
			.not.toBeInTheDocument();
	});

	it('says when the top tier is reached', async () => {
		render(ExhibitCase, { props: { exhibit: exhibit({ value: 300 }) } });

		await expect.element(page.getByText(m.career.exhibits.collection.count(300))).toBeVisible();
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
			.element(page.getByRole('button', { name: m.career.about }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByText(m.career.exhibits.night_watch.name))
			.not.toBeInTheDocument();
	});

	it('says what a found easter egg was awarded for', async () => {
		render(ExhibitCase, {
			props: {
				exhibit: exhibit({
					code: 'back_from_storage',
					value: 1,
					thresholds: [1],
					tiers: [{ ...unlocked(1), exhibit: 'back_from_storage' }]
				})
			}
		});

		await expect
			.element(page.getByRole('heading', { level: 3 }))
			.toHaveTextContent(m.career.exhibits.back_from_storage.name);
		await expect.element(page.getByText(m.career.exhibits.back_from_storage.awarded)).toBeVisible();
	});
});
