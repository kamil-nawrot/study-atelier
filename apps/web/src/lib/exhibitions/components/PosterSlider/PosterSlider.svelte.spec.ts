import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PosterSlider from './PosterSlider.svelte';

describe('PosterSlider', () => {
	it('names the slider, shows its value and reports a change as a number', async () => {
		const oninput = vi.fn();
		render(PosterSlider, { label: 'Sepia', value: 30, min: 0, max: 100, shown: '30%', oninput });

		const slider = page.getByRole('slider', { name: 'Sepia' });
		await expect.element(slider).toHaveValue('30');
		await expect.element(page.getByText('30%')).toBeVisible();
		await userEvent.fill(slider, '45');

		expect(oninput).toHaveBeenLastCalledWith(45);
	});
});
