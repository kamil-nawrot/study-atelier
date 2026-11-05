import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TimeSpan from './TimeSpan.svelte';

describe('TimeSpan', () => {
	it('names the years of the artworks and of the life, with a legend for both', async () => {
		render(TimeSpan, {
			props: {
				kind: 'author',
				years: [1476, 1503],
				bounds: { from: 1452, to: 1519 },
				events: [
					{
						id: 'e',
						name: 'Odkrycie Ameryki',
						yearFrom: null,
						yearTo: 1492,
						yearApproximate: false
					}
				]
			}
		});

		await expect
			.element(page.getByText('Twoje dzieła z lat 1476 – 1503, w ciągu życia 1452 – 1519'))
			.toBeVisible();
		await expect
			.element(
				page.getByText('Kreska to dzieło, pas to lata życia, kółko to wydarzenie z Kalendarium.')
			)
			.toBeVisible();
	});

	it('says when no artwork has a date, without a band for a style', async () => {
		render(TimeSpan, { kind: 'style', years: [], bounds: undefined });

		await expect.element(page.getByText('Żadne z tych dzieł nie ma daty')).toBeVisible();
		await expect.element(page.getByText('Kreska to dzieło.')).toBeVisible();
	});
});
