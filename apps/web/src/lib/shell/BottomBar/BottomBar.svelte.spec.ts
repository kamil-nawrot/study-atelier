import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { m } from '#lib/i18n/i18n.ts';
import BottomBar from './BottomBar.svelte';

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier'),
	data: {} as { reviewWaiting?: Promise<number> }
}));

vi.mock('$app/state', () => ({ page: pageState }));

describe('BottomBar', () => {
	beforeEach(async () => {
		await page.viewport(390, 844);
		pageState.data = {};
	});

	it('marks the atelier as current on an artwork page', async () => {
		pageState.url = new URL('http://localhost/atelier/12');
		render(BottomBar, { onadd: vi.fn(), onmenu: vi.fn() });

		await expect
			.element(page.getByRole('link', { name: m.menu.atelier }))
			.toHaveAttribute('aria-current', 'page');
		await expect
			.element(page.getByRole('link', { name: m.menu.glossary }))
			.not.toHaveAttribute('aria-current');
	});

	it('names the number of reviews due today', async () => {
		pageState.url = new URL('http://localhost/atelier/review');
		pageState.data = { reviewWaiting: Promise.resolve(7) };
		render(BottomBar, { onadd: vi.fn(), onmenu: vi.fn() });

		const review = page.getByRole('link', { name: new RegExp(`^${m.menu.review}`) });
		await expect.element(review).toHaveTextContent(m.menu.reviewWaiting(7));
		await expect.element(review).toHaveAttribute('aria-current', 'page');
	});

	it('opens adding and the menu from its buttons', async () => {
		const onadd = vi.fn();
		const onmenu = vi.fn();
		render(BottomBar, { onadd, onmenu });

		await page.getByRole('button', { name: m.common.add }).click();
		await page.getByRole('button', { name: m.menu.open }).click();

		expect(onadd).toHaveBeenCalledOnce();
		expect(onmenu).toHaveBeenCalledOnce();
	});
});
