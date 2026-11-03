import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import AcquisitionsSection from './AcquisitionsSection.svelte';

describe('AcquisitionsSection', () => {
	it('names the unit and the first day and describes a week from its start', async () => {
		render(AcquisitionsSection, {
			growth: {
				unit: 'week',
				firstDay: '2026-09-08',
				buckets: [
					{ start: '2026-09-07', added: 12 },
					{ start: '2026-09-14', added: 9 }
				]
			}
		});

		const texts = m.statistics.acquisitions;
		await expect.element(page.getByText(texts.caption('week', '8 września 2026'))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: texts.column(texts.weekFrom('7 września'), 12) }))
			.toBeInTheDocument();
	});
});
