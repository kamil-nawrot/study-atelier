import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { ResolvedPathname } from '$app/types';
import BarList from './BarList.svelte';

describe('BarList', () => {
	it('shows each row with its number and links the rows that lead somewhere', async () => {
		render(BarList, {
			rows: [
				{
					key: 'a',
					name: 'Malarstwo',
					count: 145,
					href: '/atelier?type=painting' as ResolvedPathname
				},
				{ key: 'b', name: 'pozostałe (3)', count: 7, muted: true }
			]
		});

		await expect
			.element(page.getByRole('link', { name: 'Malarstwo' }))
			.toHaveAttribute('href', '/atelier?type=painting');
		await expect.element(page.getByText('145')).toBeVisible();
		await expect.element(page.getByText('pozostałe (3)')).toBeVisible();
		await expect.element(page.getByRole('link', { name: 'pozostałe (3)' })).not.toBeInTheDocument();
	});
});
