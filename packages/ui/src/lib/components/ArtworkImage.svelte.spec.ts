import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../messages';
import ArtworkImage, { IMAGE_RETRY_DELAY } from './ArtworkImage.svelte';

const pixel =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const broken = 'data:image/png;base64,broken';

function busy(): boolean {
	return document.querySelector('[aria-busy="true"]') !== null;
}

describe('ArtworkImage', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows the image and stops priming once it has loaded', async () => {
		await render(ArtworkImage, { src: pixel, alt: 'Lady with an Ermine', width: 1, height: 1 });

		await expect.element(page.getByRole('img', { name: 'Lady with an Ermine' })).toBeVisible();
		await expect.poll(busy).toBe(false);
	});

	it('tries once more after a pause before it says the image did not load', async () => {
		await render(ArtworkImage, { src: broken, alt: 'Lady with an Ermine', width: 3, height: 4 });

		await expect
			.element(page.getByRole('img', { name: 'Lady with an Ermine' }))
			.not.toBeInTheDocument();
		vi.advanceTimersByTime(IMAGE_RETRY_DELAY - 1);
		expect(busy()).toBe(true);
		await expect.element(page.getByText(defaultUiMessages.imageFailed)).not.toBeInTheDocument();

		vi.advanceTimersByTime(1);

		await expect.element(page.getByText(defaultUiMessages.imageFailed)).toBeVisible();
		expect(busy()).toBe(false);
	});

	it('keeps the height of the image while it loads and when it did not load', async () => {
		const { container } = await render(ArtworkImage, {
			src: broken,
			alt: 'Lady with an Ermine',
			width: 300,
			height: 400
		});
		const height = (): number =>
			container.querySelector('.artwork-image')!.getBoundingClientRect().height;

		expect(height()).toBe(400);
		vi.advanceTimersByTime(IMAGE_RETRY_DELAY);

		await expect.element(page.getByText(defaultUiMessages.imageFailed)).toBeVisible();
		expect(height()).toBe(400);
	});

	it('starts loading again when it gets another image', async () => {
		const { rerender } = await render(ArtworkImage, { src: broken, alt: 'Lady with an Ermine' });
		vi.advanceTimersByTime(IMAGE_RETRY_DELAY);
		await expect.element(page.getByText(defaultUiMessages.imageFailed)).toBeVisible();

		await rerender({ src: pixel, alt: 'Wanderer above the Sea of Fog' });

		await expect
			.element(page.getByRole('img', { name: 'Wanderer above the Sea of Fog' }))
			.toBeVisible();
		await expect.element(page.getByText(defaultUiMessages.imageFailed)).not.toBeInTheDocument();
	});
});
