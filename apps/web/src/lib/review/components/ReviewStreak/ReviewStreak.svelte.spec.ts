import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import ReviewStreak from './ReviewStreak.svelte';

const wednesday = new Date(2026, 10, 4, 21, 0);

describe('ReviewStreak', () => {
	it('shows the days of the streak and the last week up to today', async () => {
		render(ReviewStreak, { streak: 5, reviewedToday: false, today: wednesday });

		await expect.element(page.getByText(m.review.streakCaption)).toBeVisible();
		await expect.element(page.getByText(m.review.streakDays(5), { exact: true })).toBeVisible();
		await expect.element(page.getByText(m.review.today, { exact: true })).toBeVisible();
		expect(document.querySelectorAll('.square.filled')).toHaveLength(5);
		expect([...document.querySelectorAll('.day')].map((day) => day.textContent)).toEqual([
			'cz',
			'pt',
			'sb',
			'nd',
			'pn',
			'wt',
			m.review.today
		]);
	});

	it('tells a screen reader about the week in one sentence', async () => {
		render(ReviewStreak, { streak: 1, reviewedToday: true, today: wednesday });

		await expect.element(page.getByText(m.review.streakWeek(1, true))).toBeInTheDocument();
		expect(m.review.streakWeek(1, true)).toBe(
			'Ostatni tydzień: powtórki przez 1 dzień z rzędu, także dziś.'
		);
		expect(m.review.streakDays(1)).toBe('dzień z rzędu');
		expect(m.review.streakWeek(5, false)).toBe(
			'Ostatni tydzień: powtórki przez 5 dni z rzędu, dziś jeszcze bez powtórki.'
		);
	});
});
