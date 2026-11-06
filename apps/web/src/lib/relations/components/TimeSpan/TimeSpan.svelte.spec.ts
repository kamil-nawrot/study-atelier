import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TimeSpan from './TimeSpan.svelte';

const discovery = {
	id: 'e',
	name: 'Odkrycie Ameryki',
	yearFrom: null,
	yearTo: 1492,
	yearApproximate: false
};

describe('TimeSpan', () => {
	it('puts the years of the band at its ends and names them only for screen readers', async () => {
		render(TimeSpan, {
			props: {
				kind: 'author',
				years: [1476, 1503],
				bounds: { from: 1452, to: 1519 },
				events: [discovery]
			}
		});

		const start = page.getByText('1452', { exact: true });
		const end = page.getByText('1519', { exact: true });
		await expect.element(start).toBeVisible();
		await expect.element(end).toBeVisible();
		expect(start.element().getAttribute('style')).toContain('left: 0%');
		expect(end.element().getAttribute('style')).toContain('right: 0%');
		await expect
			.element(page.getByText('Twoje dzieła z lat 1476 – 1503, w ciągu życia 1452 – 1519'))
			.toHaveClass('visually-hidden');
	});

	it('leaves the axis wider than the band when the artworks reach beyond it', async () => {
		render(TimeSpan, {
			props: { kind: 'era', years: [1400, 1600], bounds: { from: 1450, to: 1550 } }
		});

		const start = page.getByText('1450', { exact: true });
		expect(start.element().getAttribute('style')).toContain('left: 25%');
		expect(page.getByText('1550', { exact: true }).element().getAttribute('style')).toContain(
			'right: 25%'
		);
	});

	it('writes one range in the middle of a narrow band', async () => {
		render(TimeSpan, {
			props: { kind: 'event', years: [1000, 2000], bounds: { from: 1500, to: 1510 } }
		});

		await expect.element(page.getByText('1500 – 1510', { exact: true })).toBeVisible();
	});

	it('marks the one year of an event without artworks with a point', async () => {
		const { container } = await render(TimeSpan, {
			props: { kind: 'event', years: [], bounds: { from: 1492, to: 1492 } }
		});

		await expect.element(page.getByText('1492', { exact: true })).toBeVisible();
		expect(container.querySelector('.point')?.getAttribute('style')).toContain('left: 50%');
		expect(container.querySelector('.band')).toBeNull();
	});

	it('says when no artwork has a date, without a band for a style', async () => {
		render(TimeSpan, { kind: 'style', years: [], bounds: undefined });

		await expect.element(page.getByText('Żadne z tych dzieł nie ma daty')).toBeInTheDocument();
	});
});
