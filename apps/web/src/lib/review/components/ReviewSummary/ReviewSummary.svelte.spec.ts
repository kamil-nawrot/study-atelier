import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { SummaryGroup } from '#lib/review/types/summary-group.ts';
import ReviewSummary from './ReviewSummary.svelte';

async function renderSummary(
	groups: SummaryGroup[],
	props: Partial<ComponentProps<typeof ReviewSummary>> = {}
): Promise<void> {
	await render(ReviewSummary, {
		count: 3,
		minutes: 1,
		tomorrow: 0,
		groups,
		nextRound: 0,
		onnext: vi.fn(),
		...props
	});
}

function group(name: string): HTMLDetailsElement {
	const details = page.getByRole('region', { name: new RegExp(name) }).element().firstElementChild;
	return details as HTMLDetailsElement;
}

describe('ReviewSummary', () => {
	it('heads the round with its count and time and splits its ratings on a bar', async () => {
		await renderSummary(
			[
				{ rating: 1, artworks: [testArtwork(1, 'Artwork 1')] },
				{ rating: 3, artworks: [testArtwork(3, 'Artwork 3'), testArtwork(4, 'Artwork 4')] }
			],
			{ count: 3, minutes: 12 }
		);

		await expect
			.element(page.getByRole('heading', { level: 1, name: m.review.roundTitle(3, 12) }))
			.toBeVisible();
		expect(m.review.roundTitle(3, 12)).toBe('3 dzieła powtórzone w 12 minut');
		expect(m.review.roundTitle(1, 1)).toBe('1 dzieło powtórzone w 1 minutę');
		expect(m.review.roundTitle(19, 22)).toBe('19 dzieł powtórzonych w 22 minuty');
		expect(
			[...document.querySelectorAll('.legend li')].map((item) =>
				item.textContent?.replace(/\s+/g, ' ').trim()
			)
		).toEqual([`${m.review.groups[3]} 2`, `${m.review.groups[2]} 0`, `${m.review.groups[1]} 1`]);
	});

	it('gives each kind of extra question a line only when it was asked, and the day after it', async () => {
		await renderSummary([], {
			years: { asked: 3, hit: 2 },
			orders: { asked: 0, right: 0 },
			definitions: { asked: 3, right: 1 },
			notes: { asked: 1, right: 1 },
			tomorrow: 12
		});

		const lines = [...document.querySelectorAll('.lines li')].map((line) =>
			line.textContent?.replace(/\s+/g, ' ').trim()
		);
		expect(lines).toEqual([
			`${m.review.roundLines.years} 2/3`,
			`${m.review.roundLines.definitions} 1/3`,
			`${m.review.roundLines.notes} 1/1`,
			'Jutro będzie czekać na Ciebie 12 dzieł do powtórki'
		]);
		expect(`${m.review.tomorrowStart(2)} 2 ${m.review.tomorrowEnd(2)}`).toBe(
			'Jutro będą czekać na Ciebie 2 dzieła do powtórki'
		);
		expect(`${m.review.tomorrowStart(1)} 1 ${m.review.tomorrowEnd(1)}`).toBe(
			'Jutro będzie czekać na Ciebie 1 dzieło do powtórki'
		);
	});

	it('keeps to the heading without extra questions and with nothing tomorrow', async () => {
		await renderSummary([]);

		expect(document.querySelectorAll('.lines li')).toHaveLength(0);
	});

	it('opens the artworks to improve and collapses the others', async () => {
		await renderSummary([
			{ rating: 1, artworks: [testArtwork(1, 'Artwork 1')] },
			{ rating: 2, artworks: [testArtwork(2, 'Artwork 2')] },
			{ rating: 3, artworks: [testArtwork(3, 'Artwork 3'), testArtwork(4, 'Artwork 4')] }
		]);

		expect(group(m.review.groups[1]).open).toBe(true);
		expect(group(m.review.groups[2]).open).toBe(false);
		expect(group(m.review.groups[3]).open).toBe(false);
		await expect.element(page.getByRole('link', { name: /Artwork 1\b/ })).toBeVisible();
		await expect.element(page.getByRole('link', { name: /Artwork 3\b/ })).not.toBeInTheDocument();
	});

	it('names the count of a group in its heading and opens the group on a click', async () => {
		await renderSummary([
			{ rating: 3, artworks: [testArtwork(3, 'Artwork 3'), testArtwork(4, 'Artwork 4')] }
		]);

		const heading = page.getByRole('heading', { name: `${m.review.groups[3]} 2` });
		await expect.element(heading).toBeVisible();
		expect(group(m.review.groups[3]).open).toBe(false);
		await heading.click();
		expect(group(m.review.groups[3]).open).toBe(true);
		await expect.element(page.getByRole('link', { name: /Artwork 3\b/ })).toBeVisible();
	});

	it('offers a free review after the last round of the day', async () => {
		const onfree = vi.fn();
		await renderSummary([{ rating: 3, artworks: [testArtwork(3, 'Artwork 3')] }], {
			freeOpen: true,
			onfree
		});

		await page.getByRole('button', { name: m.review.free }).click();
		expect(onfree).toHaveBeenCalled();
	});

	it('offers another free round after a free review and says the plan did not change', async () => {
		await renderSummary([{ rating: 3, artworks: [testArtwork(3, 'Artwork 3')] }], {
			free: true,
			freeOpen: true,
			nextRound: 4
		});

		await expect.element(page.getByText(m.review.freePlan)).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.freeNextRound })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.nextRound(4) }))
			.not.toBeInTheDocument();
	});
});
