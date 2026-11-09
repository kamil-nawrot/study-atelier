import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import ExhibitionDivider from './ExhibitionDivider.svelte';

describe('ExhibitionDivider', () => {
	it('leaves an empty gap that a screen reader skips', async () => {
		render(ExhibitionDivider, { line: false });

		await expect.element(page.getByRole('separator')).not.toBeInTheDocument();
		expect(document.querySelector('.divider')?.getBoundingClientRect().height).toBe(64);
	});

	it('draws a line across the middle of the gap', async () => {
		render(ExhibitionDivider, { line: true });

		await expect.element(page.getByRole('separator')).toBeInTheDocument();
		const gap = document.querySelector('.divider')?.getBoundingClientRect();
		const line = document.querySelector('hr')?.getBoundingClientRect();
		expect(gap?.height).toBe(64);
		expect(Math.abs((line?.top ?? 0) - ((gap?.top ?? 0) + 32))).toBeLessThan(2);
	});

	it('stands the line upright through the height of a column', async () => {
		await page.viewport(1024, 800);
		render(ExhibitionDivider, { line: true, upright: true });

		await expect
			.element(page.getByRole('separator'))
			.toHaveAttribute('aria-orientation', 'vertical');
		const gap = document.querySelector('.divider')?.getBoundingClientRect();
		const line = document.querySelector('hr')?.getBoundingClientRect();
		expect(line?.width).toBeLessThan(2);
		expect(line?.height).toBe(gap?.height);
		expect(Math.abs((line?.left ?? 0) - ((gap?.left ?? 0) + (gap?.width ?? 0) / 2))).toBeLessThan(
			2
		);
	});

	it('lays an upright line flat when the columns stack on a phone', async () => {
		await page.viewport(390, 800);
		render(ExhibitionDivider, { line: true, upright: true });

		const line = document.querySelector('hr')?.getBoundingClientRect();
		expect(line?.height).toBeLessThan(2);
		expect(line?.width).toBeGreaterThan(100);
	});
});
