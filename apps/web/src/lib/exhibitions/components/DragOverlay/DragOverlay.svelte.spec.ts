import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import DragOverlay from './DragOverlay.svelte';

const line = { from: 1, to: 1, top: 100, left: 50, width: 400, height: 0, replaces: false };

describe('DragOverlay', () => {
	it('shows nothing while nothing is dragged', () => {
		render(DragOverlay, { x: 0, y: 0 });

		expect(document.querySelector('.ghost, .drop')).toBeNull();
	});

	it('shows the name of the dragged block at the pointer and the line where it lands', () => {
		render(DragOverlay, { dropAt: line, label: 'Judith', x: 30, y: 40 });

		const ghost = document.querySelector<HTMLElement>('.ghost');
		expect(ghost?.textContent?.trim()).toBe('Judith');
		expect(ghost?.style.left).toBe('30px');
		expect(document.querySelector<HTMLElement>('.drop')?.style.top).toBe('100px');
	});

	it('opens a slot beside a block and says when a row is full', async () => {
		const { rerender } = await render(DragOverlay, {
			dropAt: { ...line, beside: 4, side: 'left', full: false },
			x: 0,
			y: 0
		});
		await expect.element(page.getByText(m.exhibitions.drop.here)).toBeInTheDocument();

		await rerender({ dropAt: { ...line, beside: 4, side: 'left', full: true }, x: 0, y: 0 });
		await expect.element(page.getByText(m.exhibitions.drop.full)).toBeInTheDocument();
	});
});
