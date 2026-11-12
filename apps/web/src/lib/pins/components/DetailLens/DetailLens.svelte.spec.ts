import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DetailLens from './DetailLens.svelte';

const PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const thumbnail = { src: PIXEL, left: -200, top: -325, width: 1000, height: 500 };

describe('DetailLens', () => {
	it('shows the stored crop of the pin', () => {
		render(DetailLens, { lens: { crop: PIXEL, thumbnail } });

		expect(document.querySelector('.lens > img')?.getAttribute('src')).toBe(PIXEL);
		expect(document.querySelector('img.view')).toBeNull();
	});

	it('cuts the view from the image while the pin has no crop', () => {
		render(DetailLens, { lens: { thumbnail } });

		const view = document.querySelector<HTMLElement>('img.view');
		expect(view?.style.left).toBe('-200%');
		expect(view?.style.height).toBe('500%');
	});

	it('falls back to the view when the crop does not load', async () => {
		render(DetailLens, { lens: { crop: 'https://storage.invalid/missing.jpg', thumbnail } });

		await expect.poll(() => document.querySelector('img.view')).not.toBeNull();
	});

	it('shows an empty lens when there is no image at all', () => {
		render(DetailLens, { lens: { thumbnail: { left: 0, top: 0, width: 100, height: 100 } } });

		expect(document.querySelector('.lens img')).toBeNull();
		expect(document.querySelector('.lens .ring')).not.toBeNull();
	});
});
