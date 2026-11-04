import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { OrderItem } from '#lib/review/types/order-item.ts';
import OrderGuess from './OrderGuess.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const venus = testArtwork(1, 'Venus of Willendorf', { authors: [], yearTo: -28000 });
const nefertiti = testArtwork(2, 'Bust of Nefertiti', { authors: ['Thutmose'], yearTo: -1345 });
const arnolfini = testArtwork(3, 'The Arnolfini Portrait', {
	authors: ['Jan van Eyck'],
	yearTo: 1434
});
const starry = testArtwork(4, 'The Starry Night', { authors: ['Vincent van Gogh'], yearTo: 1889 });
const item: OrderItem = { mode: 'order', artworks: [arnolfini, venus, starry, nefertiti] };

function renderGuess(ordered?: WallArtwork[]): {
	oncheck: ReturnType<typeof vi.fn>;
	onnext: ReturnType<typeof vi.fn>;
} {
	const oncheck = vi.fn();
	const onnext = vi.fn();
	render(OrderGuess, { item, ordered, oncheck, onnext });
	return { oncheck, onnext };
}

function press(element: Element, key: string): void {
	element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function tile(place: number): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.review.order.place(place, 4) });
}

describe('OrderGuess', () => {
	it('orders the images from the keyboard, says each step and checks the new order', async () => {
		const { oncheck } = renderGuess();

		press(tile(2).element(), ' ');
		await expect.element(page.getByText(m.review.order.lifted)).toBeInTheDocument();
		press(tile(2).element(), 'ArrowLeft');
		await expect.element(page.getByText(m.review.order.moved(1, 4))).toBeInTheDocument();
		await expect.element(tile(1)).toHaveFocus();
		press(tile(1).element(), ' ');
		await expect.element(page.getByText(m.review.order.dropped(1))).toBeInTheDocument();

		press(tile(4).element(), ' ');
		press(tile(4).element(), 'ArrowUp');
		await expect.element(tile(3)).toHaveFocus();
		press(tile(3).element(), 'ArrowUp');
		await expect.element(tile(2)).toHaveFocus();
		press(tile(2).element(), ' ');

		press(tile(3).element(), ' ');
		press(tile(3).element(), 'ArrowDown');
		await expect.element(tile(4)).toHaveFocus();
		press(tile(4).element(), 'Escape');
		await expect.element(page.getByText(m.review.order.dropped(3))).toBeInTheDocument();

		await page.getByRole('button', { name: m.review.order.check }).click();
		expect(oncheck).toHaveBeenCalledWith([venus, nefertiti, arnolfini, starry]);
	});

	it('asks for the order with the hints and checks the order shown', async () => {
		const { oncheck } = renderGuess();

		await expect.element(page.getByText(m.review.order.tag)).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: m.review.order.question }))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.review.order.hint)).toBeInTheDocument();
		await expect.element(page.getByText(m.review.order.keyboardHint)).toBeInTheDocument();
		await expect.element(page.getByText('The Starry Night')).not.toBeInTheDocument();

		await page.getByRole('button', { name: m.review.order.check }).click();
		expect(oncheck).toHaveBeenCalledWith(item.artworks);
	});

	it('praises a whole order put right and lists it from the oldest', async () => {
		const { onnext } = renderGuess([venus, nefertiti, arnolfini, starry]);

		await expect.element(page.getByText(m.review.order.right)).toBeInTheDocument();
		await expect.element(page.getByText(m.review.order.trueOrder)).toBeInTheDocument();
		const entries = page.getByRole('listitem').filter({ hasText: /, / }).elements();
		expect(entries.map((entry) => entry.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			`Venus of Willendorf, ${m.ui.unknownAuthor}, 28000 p.n.e.`,
			'Bust of Nefertiti, Thutmose, 1345 p.n.e.',
			'The Arnolfini Portrait, Jan van Eyck, 1434',
			'The Starry Night, Vincent van Gogh, 1889'
		]);

		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(onnext).toHaveBeenCalledOnce();
	});

	it('says how many artworks found their place, or that none did', async () => {
		renderGuess([venus, arnolfini, nefertiti, starry]);
		await expect.element(page.getByText(m.review.order.some(2, 4))).toBeInTheDocument();
		expect(m.review.order.some(1, 4)).toBe('Prawie: 1 z 4 dzieł trafiło na swoje miejsce.');
	});

	it('says when no artwork is in its place', async () => {
		renderGuess([starry, arnolfini, venus, nefertiti]);
		await expect.element(page.getByText(m.review.order.none)).toBeInTheDocument();
	});
});
