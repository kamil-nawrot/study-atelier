import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	AT_REST,
	bounded,
	MAX_SCALE,
	PinchZoom,
	pinched,
	TAP_SCALE,
	tapped
} from './pinch-zoom.svelte.ts';

const centre = { x: 200, y: 400 };

describe('pinched', () => {
	it('grows with the distance between the fingers and keeps the point between them in place', () => {
		const view = pinched(
			AT_REST,
			[
				{ x: 250, y: 400 },
				{ x: 350, y: 400 }
			],
			[
				{ x: 200, y: 400 },
				{ x: 400, y: 400 }
			],
			centre
		);

		expect(view.scale).toBe(2);
		expect(view).toEqual({ scale: 2, x: -100, y: 0 });
	});

	it('never goes below the whole image or above the largest zoom', () => {
		const pair = (gap: number): [{ x: number; y: number }, { x: number; y: number }] => [
			{ x: 200 - gap, y: 400 },
			{ x: 200 + gap, y: 400 }
		];

		expect(pinched(AT_REST, pair(100), pair(10), centre).scale).toBe(1);
		expect(pinched(AT_REST, pair(10), pair(200), centre).scale).toBe(MAX_SCALE);
	});
});

describe('bounded', () => {
	it('keeps the zoomed image over the frame', () => {
		const view = bounded(
			{ scale: 2, x: 500, y: -500 },
			{ width: 300, height: 200 },
			{ width: 400, height: 800 }
		);

		expect(view).toEqual({ scale: 2, x: 100, y: 0 });
	});
});

describe('tapped', () => {
	it('zooms in on the tapped point and back out on the next double tap', () => {
		const view = tapped(AT_REST, { x: 300, y: 400 }, centre);

		expect(view).toEqual({ scale: TAP_SCALE, x: -150, y: 0 });
		expect(tapped(view, { x: 300, y: 400 }, centre)).toEqual(AT_REST);
	});
});

describe('PinchZoom', () => {
	let frame: HTMLElement;

	afterEach(() => frame.remove());

	function setUp(onswipe = vi.fn()): {
		zoom: PinchZoom;
		onswipe: typeof onswipe;
		detach: () => void;
	} {
		frame = document.createElement('div');
		frame.style.cssText = 'position: fixed; left: 0; top: 0; width: 400px; height: 800px;';
		const image = document.createElement('div');
		image.style.cssText = 'width: 400px; height: 300px;';
		frame.appendChild(image);
		document.body.appendChild(frame);
		const zoom = new PinchZoom();
		const detach = zoom.attach(() => image, onswipe)(frame) as () => void;
		return { zoom, onswipe, detach };
	}

	function touch(type: string, id: number, x: number, y: number, timeStamp?: number): void {
		const event = new PointerEvent(type, {
			pointerId: id,
			pointerType: 'touch',
			clientX: x,
			clientY: y,
			bubbles: true
		});
		if (timeStamp !== undefined) Object.defineProperty(event, 'timeStamp', { value: timeStamp });
		frame.dispatchEvent(event);
	}

	it('zooms with two fingers and pans the zoomed image with one', () => {
		const { zoom, detach } = setUp();

		touch('pointerdown', 1, 150, 400);
		touch('pointerdown', 2, 250, 400);
		touch('pointermove', 1, 100, 400);
		touch('pointermove', 2, 300, 400);
		expect(zoom.view.scale).toBe(2);
		touch('pointerup', 1, 100, 400);
		touch('pointerup', 2, 300, 400);

		touch('pointerdown', 3, 200, 400);
		touch('pointermove', 3, 260, 400);
		expect(zoom.view.x).toBe(60);
		touch('pointerup', 3, 260, 400);
		detach();
	});

	it('swipes to the next image only while the image is not zoomed', () => {
		const { zoom, onswipe, detach } = setUp();

		touch('pointerdown', 1, 300, 400);
		touch('pointermove', 1, 150, 400);
		touch('pointerup', 1, 150, 400);
		expect(onswipe).toHaveBeenCalledWith('next');

		zoom.view = { scale: 2, x: 0, y: 0 };
		touch('pointerdown', 2, 300, 400);
		touch('pointermove', 2, 150, 400);
		touch('pointerup', 2, 150, 400);
		expect(onswipe).toHaveBeenCalledTimes(1);
		detach();
	});

	it('zooms in and out with a double tap', () => {
		const { zoom, detach } = setUp();

		touch('pointerdown', 1, 200, 400, 0);
		touch('pointerup', 1, 200, 400, 50);
		touch('pointerdown', 2, 200, 400, 150);
		touch('pointerup', 2, 200, 400, 200);
		expect(zoom.view.scale).toBe(TAP_SCALE);

		touch('pointerdown', 3, 200, 400, 1000);
		touch('pointerup', 3, 200, 400, 1050);
		touch('pointerdown', 4, 200, 400, 1150);
		touch('pointerup', 4, 200, 400, 1200);
		expect(zoom.view).toEqual(AT_REST);
		detach();
	});
	it('does not count the end of a pinch as a tap', () => {
		const { zoom, detach } = setUp();

		touch('pointerdown', 1, 150, 400, 0);
		touch('pointerdown', 2, 250, 400, 10);
		touch('pointermove', 2, 350, 400, 50);
		touch('pointerup', 2, 350, 400, 100);
		touch('pointerup', 1, 150, 400, 120);
		const pinched = zoom.view;
		touch('pointerdown', 3, 150, 400, 200);
		touch('pointerup', 3, 150, 400, 250);

		expect(zoom.view).toEqual(pinched);
		detach();
	});

	it('does not swipe with the finger left after pinching back to the whole image', () => {
		const { onswipe, detach } = setUp();

		touch('pointerdown', 1, 150, 400);
		touch('pointerdown', 2, 250, 400);
		touch('pointermove', 2, 350, 400);
		touch('pointermove', 2, 250, 400);
		touch('pointerup', 2, 250, 400);
		touch('pointermove', 1, 20, 400);
		touch('pointerup', 1, 20, 400);

		expect(onswipe).not.toHaveBeenCalled();
		detach();
	});

	it('leaves taps on the buttons of the viewer out of the double tap', () => {
		const { zoom, detach } = setUp();
		const button = document.createElement('button');
		frame.appendChild(button);
		const tapButton = (type: string, id: number, timeStamp: number): void => {
			const event = new PointerEvent(type, {
				pointerId: id,
				pointerType: 'touch',
				clientX: 200,
				clientY: 400,
				bubbles: true
			});
			Object.defineProperty(event, 'timeStamp', { value: timeStamp });
			button.dispatchEvent(event);
		};

		tapButton('pointerdown', 1, 0);
		tapButton('pointerup', 1, 50);
		touch('pointerdown', 2, 200, 400, 150);
		touch('pointerup', 2, 200, 400, 200);

		expect(zoom.view).toEqual(AT_REST);
		detach();
	});
});
