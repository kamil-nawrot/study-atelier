import { createRawSnippet, type Snippet } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import LensStrip from './LensStrip.svelte';

function lens(width: number): Snippet {
	return createRawSnippet(() => ({
		render: () => `<li style="--detail-lens: ${width}px"><span>Lens</span></li>`
	}));
}

function arrowsShown(): boolean {
	return [...document.querySelectorAll('.arrow')].some(
		(arrow) => getComputedStyle(arrow).display !== 'none'
	);
}

async function show(width: number): Promise<void> {
	await render(LensStrip, {
		count: 1,
		backLabel: 'Back',
		forwardLabel: 'Forward',
		children: lens(width)
	});
}

describe('LensStrip', () => {
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	it('scrolls a row wider than the strip with the arrows', async () => {
		await show(3000);

		const back = page.getByRole('button', { name: 'Back' });
		const forward = page.getByRole('button', { name: 'Forward' });
		await expect.element(back).toBeDisabled();
		await expect.element(forward).toBeEnabled();
		await forward.click();
		await expect.poll(() => document.querySelector('ul')?.scrollLeft ?? 0).toBeGreaterThan(0);
		await expect.element(back).toBeEnabled();
	});

	it('hides the arrows when every lens fits', async () => {
		await show(160);

		await expect.element(page.getByText('Lens')).toBeVisible();
		expect(arrowsShown()).toBe(false);
	});

	it('scrolls sideways on a phone without the arrows', async () => {
		await page.viewport(390, 800);
		await show(1000);

		await expect.element(page.getByText('Lens')).toBeVisible();
		expect(arrowsShown()).toBe(false);
		const strip = document.querySelector('ul');
		expect((strip?.scrollWidth ?? 0) > (strip?.clientWidth ?? 0)).toBe(true);
	});
});
