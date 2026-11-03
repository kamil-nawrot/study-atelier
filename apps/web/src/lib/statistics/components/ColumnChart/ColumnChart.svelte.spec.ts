import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ColumnChart from './ColumnChart.svelte';

describe('ColumnChart', () => {
	it('draws a column per addition and describes it on hover', async () => {
		render(ColumnChart, {
			label: 'Dzieła dodane w czasie',
			columns: [
				{ start: '2026-10-14', added: 5, label: '14.10' },
				{ start: '2026-10-15', added: 0 },
				{ start: '2026-10-16', added: 2 }
			],
			describe: (column) => `${column.start}: ${column.added}`
		});

		const column = page.getByRole('button', { name: '2026-10-14: 5' });
		await expect.element(column).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: '2026-10-15: 0' }))
			.not.toBeInTheDocument();
		await userEvent.hover(column);
		await expect.element(page.getByText('2026-10-14: 5', { exact: true })).toBeVisible();
	});
});
