import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import WallCount from './WallCount.svelte';

describe('WallCount', () => {
	it('is one link to the statistics that shows the count and names the view', async () => {
		render(WallCount, { count: m.atelier.filteredCount(63, 292) });

		const link = page.getByRole('link', {
			name: m.statistics.wallLink(m.atelier.filteredCount(63, 292))
		});
		await expect.element(link).toHaveAttribute('href', '/atelier/statistics');
		await expect.element(link).toHaveTextContent(m.atelier.filteredCount(63, 292));
	});

	it('leads to the map right after the statistics', async () => {
		render(WallCount, { count: m.atelier.count(5) });

		await expect
			.element(page.getByRole('link', { name: m.map.wallLink }))
			.toHaveAttribute('href', '/atelier/map');
	});
});
