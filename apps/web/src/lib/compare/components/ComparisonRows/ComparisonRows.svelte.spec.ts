import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import ComparisonRows from './ComparisonRows.svelte';

describe('ComparisonRows', () => {
	it('shows each row with its label and both values', async () => {
		await render(ComparisonRows, {
			rows: [
				{ key: 'styles', label: 'Styl', left: [{ text: 'barok' }], right: [] },
				{
					key: 'location',
					label: 'Miejsce',
					left: [{ text: 'NHM', isNew: true }],
					right: [{ text: 'NHM', isNew: true }]
				}
			]
		});

		await expect.element(page.getByRole('group', { name: 'Styl' })).toHaveTextContent('barok');
		await expect
			.element(page.getByRole('group', { name: 'Styl' }))
			.toHaveTextContent(m.artworkView.empty);
		expect(page.getByText(m.compare.newValue).elements()).toHaveLength(2);
	});
});
