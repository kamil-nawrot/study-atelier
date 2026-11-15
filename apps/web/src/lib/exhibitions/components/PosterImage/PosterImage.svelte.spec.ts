import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PosterImage from './PosterImage.svelte';

describe('PosterImage', () => {
	it('draws the crop and the filters of the poster', async () => {
		const screen = await render(PosterImage, {
			src: 'https://images.example.test/a.jpg',
			crop: { x: 0.25, y: 0.75, zoom: 2 },
			filters: { grayscale: 40, sepia: 0, brightness: 100, contrast: 100, saturate: 100 }
		});

		const image = screen.container.querySelector('img');
		expect(image?.style.objectPosition).toBe('25% 75%');
		expect(image?.style.transform).toBe('scale(2)');
		expect(image?.style.filter).toBe('grayscale(40%)');
	});

	it('draws the whole image without a crop or filters', async () => {
		const screen = await render(PosterImage, { src: 'https://images.example.test/a.jpg' });

		const image = screen.container.querySelector('img');
		expect(image?.style.objectPosition).toBe('');
		expect(image?.style.transform).toBe('');
		expect(image?.style.filter).toBe('');
	});
});
