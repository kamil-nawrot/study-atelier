import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DragOverlay from './DragOverlay.svelte';

describe('DragOverlay', () => {
	it('shows nothing while no block is dragged', () => {
		render(DragOverlay, {
			x: 10,
			y: 10,
			mark: { top: 0, left: 0, width: 100, height: 4, side: false }
		});

		expect(document.querySelector('.ghost')).toBeNull();
		expect(document.querySelector('.mark')).toBeNull();
	});

	it('shows the dragged block at the pointer and a line where it lands', () => {
		render(DragOverlay, {
			label: 'Tekst',
			x: 10,
			y: 20,
			mark: { top: 30, left: 0, width: 100, height: 4, side: false }
		});

		expect(document.querySelector<HTMLElement>('.ghost')?.style.top).toBe('20px');
		expect(document.querySelector('.ghost')?.textContent).toContain('Tekst');
		expect(document.querySelector<HTMLElement>('.mark')?.style.width).toBe('100px');
		expect(document.querySelector('.mark[data-side]')).toBeNull();
	});

	it('marks a new column at the edge of a block', () => {
		render(DragOverlay, {
			label: 'Tekst',
			x: 10,
			y: 20,
			mark: { top: 0, left: 50, width: 4, height: 200, side: true }
		});

		expect(document.querySelector('.mark[data-side]')).not.toBeNull();
	});

	it('keeps a mark below the top bar', () => {
		render(DragOverlay, {
			label: 'Tekst',
			x: 10,
			y: 20,
			top: 80,
			mark: { top: 30, left: 50, width: 4, height: 200, side: true }
		});

		expect(document.querySelector<HTMLElement>('.mark')?.style.top).toBe('80px');
		expect(document.querySelector<HTMLElement>('.mark')?.style.height).toBe('150px');
	});
});
