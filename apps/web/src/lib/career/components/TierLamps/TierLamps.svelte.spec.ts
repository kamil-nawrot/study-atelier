import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';
import TierLamps from './TierLamps.svelte';

const unlocked = (tier: number, seen = true): UnlockedTier => ({
	exhibit: 'collection',
	tier,
	unlockedAt: new Date(2026, 9, tier),
	seenAt: seen ? new Date(2026, 9, 20) : undefined
});

function renderLamps(tiers: UnlockedTier[]): void {
	render(TierLamps, {
		props: {
			exhibit: { code: 'collection', value: 24, thresholds: [1, 10, 50, 100, 250], tiers },
			tier: tiers.length
		}
	});
}

function ring(level: string): string {
	const lamp = page.getByRole('button', { name: m.career.tierLabel(level), exact: true }).element();
	return getComputedStyle(lamp.firstElementChild as Element).outlineStyle;
}

describe('TierLamps', () => {
	it('opens the date and the curiosity of an unlocked tier from its lamp', async () => {
		renderLamps([unlocked(1), unlocked(2)]);

		await page.getByRole('button', { name: m.career.tierLabel('II'), exact: true }).click();

		const tier = page.getByRole('dialog', { name: m.career.tierLabel('II') });
		await expect.element(tier).toHaveTextContent(m.career.tierDate('II', '2 października 2026'));
		await expect.element(tier).toHaveTextContent(m.career.curiosities.collection[1]);
		await expect
			.element(tier.getByRole('link', { name: m.career.source }))
			.toHaveAttribute('href', 'https://www.savevenice.org/project/jacopo-tintoretto-paradise');
	});

	it('shows only one tier at a time', async () => {
		renderLamps([unlocked(1), unlocked(2)]);

		await page.getByRole('button', { name: m.career.tierLabel('I'), exact: true }).click();
		await page.getByRole('button', { name: m.career.tierLabel('II'), exact: true }).click();

		await expect.element(page.getByRole('dialog')).toHaveAccessibleName(m.career.tierLabel('II'));
	});

	it('gives only the date of a tier without a curiosity', async () => {
		renderLamps([unlocked(1), unlocked(2), unlocked(3)]);

		await page.getByRole('button', { name: m.career.tierLabel('III'), exact: true }).click();

		await expect
			.element(page.getByRole('dialog'))
			.toHaveTextContent(m.career.tierDate('III', '3 października 2026'));
		await expect.element(page.getByRole('link')).not.toBeInTheDocument();
	});

	it('rings the lamp of a new tier that brings a curiosity', async () => {
		renderLamps([unlocked(1), unlocked(2, false), unlocked(3, false)]);

		expect(ring('II')).toBe('solid');
		expect(ring('I')).toBe('none');
		expect(ring('III')).toBe('none');
	});

	it('leaves the lamps of tiers not reached dark and silent', async () => {
		renderLamps([unlocked(1)]);

		await expect.element(page.getByRole('button')).toHaveAccessibleName(m.career.tierLabel('I'));
	});
});
