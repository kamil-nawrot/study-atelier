import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { BlockDrag, EDGE, edgeStep, type DragHandlers } from './block-drag.svelte.ts';

function pointer(type: string, x: number, y: number, extra: PointerEventInit = {}): PointerEvent {
	return new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		clientX: x,
		clientY: y,
		button: 0,
		pointerId: 1,
		pointerType: 'mouse',
		...extra
	});
}

type Spies = { [Key in keyof DragHandlers]: Mock<DragHandlers[Key]> };

function handlers(): Spies {
	return {
		onstart: vi.fn<DragHandlers['onstart']>(),
		onmove: vi.fn<DragHandlers['onmove']>(),
		ondrop: vi.fn<DragHandlers['ondrop']>(),
		onend: vi.fn<DragHandlers['onend']>()
	};
}

describe('edgeStep', () => {
	it('scrolls up near the top, down near the bottom and not in between', () => {
		expect(edgeStep(80 + EDGE / 2, 80, 900)).toBeLessThan(0);
		expect(edgeStep(900 - EDGE / 2, 80, 900)).toBeGreaterThan(0);
		expect(edgeStep(500, 80, 900)).toBe(0);
	});

	it('scrolls faster closer to the edge', () => {
		expect(edgeStep(890, 0, 900)).toBeGreaterThan(edgeStep(850, 0, 900));
	});
});

describe('BlockDrag', () => {
	const drag = new BlockDrag(() => 0);

	afterEach(() => drag.cancel());

	it('treats a press without movement as a click', () => {
		const given = handlers();
		drag.begin(pointer('pointerdown', 10, 10), 'Alpha', given);

		window.dispatchEvent(pointer('pointermove', 12, 11));
		window.dispatchEvent(pointer('pointerup', 12, 11));

		expect(given.onstart).not.toHaveBeenCalled();
		expect(given.ondrop).not.toHaveBeenCalled();
		expect(drag.active).toBe(false);
	});

	it('starts after a few pixels, follows the pointer and drops where it is let go', () => {
		const given = handlers();
		drag.begin(pointer('pointerdown', 10, 10), 'Alpha', given);

		window.dispatchEvent(pointer('pointermove', 30, 40));
		expect(given.onstart).toHaveBeenCalledOnce();
		expect(drag.label).toBe('Alpha');
		expect(given.onmove).toHaveBeenLastCalledWith(30, 40);

		window.dispatchEvent(new Event('scroll'));
		expect(given.onmove).toHaveBeenCalledTimes(2);

		window.dispatchEvent(pointer('pointerup', 35, 45));
		expect(given.ondrop).toHaveBeenCalledWith(35, 45);
		expect(given.onend).toHaveBeenCalledOnce();
		expect(drag.active).toBe(false);
	});

	it('ignores another pointer', () => {
		const given = handlers();
		drag.begin(pointer('pointerdown', 10, 10), 'Alpha', given);

		window.dispatchEvent(pointer('pointermove', 90, 90, { pointerId: 2 }));

		expect(given.onstart).not.toHaveBeenCalled();
	});

	it('does not start from a touch or another button', () => {
		expect(
			drag.begin(pointer('pointerdown', 0, 0, { pointerType: 'touch' }), 'A', handlers())
		).toBe(false);
		expect(drag.begin(pointer('pointerdown', 0, 0, { button: 2 }), 'A', handlers())).toBe(false);
	});

	it('ends without a drop on Escape or when the system cancels the pointer', () => {
		const first = handlers();
		drag.begin(pointer('pointerdown', 10, 10), 'Alpha', first);
		window.dispatchEvent(pointer('pointermove', 50, 50));
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
		expect(drag.active).toBe(true);
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(first.onend).toHaveBeenCalledOnce();
		expect(first.ondrop).not.toHaveBeenCalled();

		const second = handlers();
		drag.begin(pointer('pointerdown', 10, 10), 'Beta', second);
		window.dispatchEvent(pointer('pointermove', 50, 50));
		window.dispatchEvent(pointer('pointercancel', 50, 50));
		expect(second.onend).toHaveBeenCalledOnce();
		expect(second.ondrop).not.toHaveBeenCalled();
	});

	it('scrolls the page while the pointer stays near the bottom edge', async () => {
		const scroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
		drag.begin(pointer('pointerdown', 10, 10), 'Alpha', handlers());
		window.dispatchEvent(pointer('pointermove', 10, window.innerHeight - 2));

		await vi.waitFor(() => expect(scroll).toHaveBeenCalled());
		expect(scroll.mock.calls[0][1]).toBeGreaterThan(0);
		scroll.mockRestore();
	});
});
