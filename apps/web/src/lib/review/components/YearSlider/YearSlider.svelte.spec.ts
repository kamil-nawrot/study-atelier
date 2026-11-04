import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import YearSlider from './YearSlider.svelte';

function press(element: Element, key: string): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('YearSlider', () => {
	it('shows the guessed year over a slider named for the year, with the era at its ends', async () => {
		render(YearSlider, { bounds: [1492, 1789], value: 1641, oncheck: vi.fn() });

		const slider = page.getByRole('slider', { name: m.review.year.slider });
		await expect.element(slider).toHaveValue('1641');
		await expect.element(slider).toHaveAttribute('aria-valuetext', '1641');
		await expect.element(page.getByText('1492')).toBeInTheDocument();
		await expect.element(page.getByText('1789')).toBeInTheDocument();
	});

	it('moves a tenth of the era with Page Up and Page Down and checks with Enter', async () => {
		const oncheck = vi.fn();
		render(YearSlider, { bounds: [1492, 1789], value: 1641, oncheck });
		const slider = page.getByRole('slider', { name: m.review.year.slider });

		press(slider.element(), 'PageUp');
		await expect.element(slider).toHaveAttribute('aria-valuetext', '1671');
		press(slider.element(), 'PageDown');
		press(slider.element(), 'PageDown');
		await expect.element(slider).toHaveAttribute('aria-valuetext', '1611');
		press(slider.element(), 'Enter');
		expect(oncheck).toHaveBeenCalledOnce();
	});

	it('skips the year 0 when the slider moves across it', async () => {
		render(YearSlider, { bounds: [-3000, 476], value: -1, oncheck: vi.fn() });
		const slider = page.getByRole('slider', { name: m.review.year.slider });

		await slider.fill('0');
		await expect.element(slider).toHaveAttribute('aria-valuetext', '1');
	});

	it('reads a year before the common era as text', async () => {
		render(YearSlider, { bounds: [-40000, -3000], value: -21500, oncheck: vi.fn() });

		await expect
			.element(page.getByRole('slider', { name: m.review.year.slider }))
			.toHaveAttribute('aria-valuetext', '21500 p.n.e.');
	});
});
