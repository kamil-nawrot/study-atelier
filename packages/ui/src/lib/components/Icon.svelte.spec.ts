import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ImageIcon from '@lucide/svelte/icons/image';
import Icon from './Icon.svelte';

function svg(): SVGElement {
	const element = document.querySelector('svg');
	if (!element) throw new Error('No icon rendered');
	return element;
}

describe('Icon', () => {
	it('is hidden from assistive technology without a label', async () => {
		render(Icon, { icon: ImageIcon });

		expect(svg().getAttribute('aria-hidden')).toBe('true');
		expect(page.getByRole('img').elements()).toHaveLength(0);
	});

	it('becomes an image named by its label', async () => {
		render(Icon, { icon: ImageIcon, label: 'No image' });

		await expect.element(page.getByRole('img', { name: 'No image' })).toBeVisible();
		expect(svg().hasAttribute('aria-hidden')).toBe(false);
	});

	it('is 24 pixels by default', async () => {
		render(Icon, { icon: ImageIcon });

		expect(svg().getBoundingClientRect().width).toBe(24);
	});

	it('is 20 pixels in the small size', async () => {
		render(Icon, { icon: ImageIcon, size: 'sm' });

		expect(svg().getBoundingClientRect().width).toBe(20);
	});
});
