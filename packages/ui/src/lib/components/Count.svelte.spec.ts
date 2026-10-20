import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Count from './Count.svelte';

describe('Count', () => {
	it('shows the number and passes attributes on', async () => {
		render(Count, { value: 12, 'aria-hidden': 'true' });

		const count = page.getByText('12');
		await expect.element(count).toBeInTheDocument();
		await expect.element(count).toHaveAttribute('aria-hidden', 'true');
	});
});
