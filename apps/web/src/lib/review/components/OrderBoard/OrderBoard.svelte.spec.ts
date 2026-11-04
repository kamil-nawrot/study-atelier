import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import OrderBoard from './OrderBoard.svelte';

const artworks = [1, 2, 3, 4].map((number) =>
	testArtwork(number, `Artwork ${number}`, { yearTo: 1400 + number * 100 })
);

function press(element: Element, key: string): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function renderBoard(answered = false): { onchange: ReturnType<typeof vi.fn> } {
	const onchange = vi.fn();
	render(OrderBoard, { artworks, answered, onchange });
	return { onchange };
}

function tile(place: number): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.review.order.place(place, 4) });
}

describe('OrderBoard', () => {
	it('names every image only by its place between the oldest and the newest', async () => {
		renderBoard();

		await expect.element(page.getByText(m.review.order.oldest)).toBeInTheDocument();
		await expect.element(page.getByText(m.review.order.newest)).toBeInTheDocument();
		for (const place of [1, 2, 3, 4]) await expect.element(tile(place)).toBeInTheDocument();
		await expect.element(page.getByText('Artwork 1')).not.toBeInTheDocument();
	});

	it('asks to move an image one place with the keyboard', async () => {
		const { onchange } = renderBoard();

		press(tile(1).element(), 'ArrowRight');
		expect(onchange).not.toHaveBeenCalled();
		press(tile(1).element(), ' ');
		await expect.element(tile(1)).toHaveAttribute('aria-pressed', 'true');
		press(tile(1).element(), 'ArrowRight');
		expect(onchange).toHaveBeenCalledWith([artworks[1], artworks[0], artworks[2], artworks[3]]);
	});

	it('moves nothing after the answer', async () => {
		const { onchange } = renderBoard(true);

		press(tile(1).element(), ' ');
		press(tile(1).element(), 'ArrowRight');
		expect(onchange).not.toHaveBeenCalled();
		await expect.element(page.getByText('Artwork 1')).not.toBeInTheDocument();
	});
});
