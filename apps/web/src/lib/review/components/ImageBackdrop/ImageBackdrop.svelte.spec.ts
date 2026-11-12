import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ImageBackdrop from './ImageBackdrop.svelte';

describe('ImageBackdrop', () => {
	it('repeats the image behind the artwork, hidden from screen readers', async () => {
		const screen = await render(ImageBackdrop, { src: '/image.jpg' });
		const backdrop = screen.container.querySelector('[data-backdrop]');

		expect(backdrop?.getAttribute('aria-hidden')).toBe('true');
		expect(backdrop?.querySelector('img')?.getAttribute('src')).toBe('/image.jpg');
	});
});
