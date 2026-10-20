import { afterEach, describe, expect, it, vi } from 'vitest';
import { keyDirection, swipe, swipeDirection } from './flip.ts';

function key(init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { cancelable: true, ...init });
	Object.defineProperty(event, 'target', { value: target });
	return event;
}

function pointer(type: string, x: number, y: number, init: PointerEventInit = {}): PointerEvent {
	return new PointerEvent(type, {
		clientX: x,
		clientY: y,
		isPrimary: true,
		pointerId: 1,
		pointerType: 'touch',
		...init
	});
}

describe('swipeDirection', () => {
	it('goes to the next artwork on a swipe to the left', () => {
		expect(swipeDirection(-80, 10)).toBe('next');
	});

	it('goes to the previous artwork on a swipe to the right', () => {
		expect(swipeDirection(80, -10)).toBe('previous');
	});

	it('ignores a short move', () => {
		expect(swipeDirection(-30, 0)).toBeUndefined();
	});

	it('ignores a move that is mostly vertical', () => {
		expect(swipeDirection(-80, 60)).toBeUndefined();
	});
});

describe('keyDirection', () => {
	it('reads the left and right arrow keys', () => {
		expect(keyDirection(key({ key: 'ArrowLeft' }))).toBe('previous');
		expect(keyDirection(key({ key: 'ArrowRight' }))).toBe('next');
		expect(keyDirection(key({ key: 'ArrowDown' }))).toBeUndefined();
	});

	it('leaves arrow keys with a modifier to the browser', () => {
		expect(keyDirection(key({ key: 'ArrowLeft', altKey: true }))).toBeUndefined();
		expect(keyDirection(key({ key: 'ArrowRight', metaKey: true }))).toBeUndefined();
		expect(keyDirection(key({ key: 'ArrowRight', shiftKey: true }))).toBeUndefined();
	});

	it('leaves arrow keys in a text field, a select, an editable region or a dialog alone', () => {
		const input = document.createElement('input');
		const select = document.createElement('select');
		const editable = document.createElement('div');
		editable.contentEditable = 'true';
		const dialog = document.createElement('dialog');
		const button = document.createElement('button');
		dialog.appendChild(button);
		for (const element of [input, select, editable, dialog]) document.body.appendChild(element);

		for (const target of [input, select, editable, button])
			expect(keyDirection(key({ key: 'ArrowRight' }, target))).toBeUndefined();

		input.remove();
		select.remove();
		editable.remove();
		dialog.remove();
	});

	it('ignores a key another handler already used', () => {
		const event = key({ key: 'ArrowRight' });
		event.preventDefault();

		expect(keyDirection(event)).toBeUndefined();
	});
});

describe('swipe', () => {
	let element: HTMLElement;
	let cleanup: (() => void) | void;

	afterEach(() => {
		cleanup?.();
		element.remove();
	});

	function attach(onswipe: (direction: string) => void): void {
		element = document.createElement('div');
		document.body.appendChild(element);
		cleanup = swipe(onswipe)(element);
	}

	it('reports a horizontal swipe of a finger', () => {
		const onswipe = vi.fn();
		attach(onswipe);

		element.dispatchEvent(pointer('pointerdown', 200, 100));
		element.dispatchEvent(pointer('pointerup', 100, 110));

		expect(onswipe).toHaveBeenCalledWith('next');
	});

	it('ignores a mouse drag', () => {
		const onswipe = vi.fn();
		attach(onswipe);

		element.dispatchEvent(pointer('pointerdown', 200, 100, { pointerType: 'mouse' }));
		element.dispatchEvent(pointer('pointerup', 100, 100, { pointerType: 'mouse' }));

		expect(onswipe).not.toHaveBeenCalled();
	});

	it('ignores a touch the browser took over for scrolling', () => {
		const onswipe = vi.fn();
		attach(onswipe);

		element.dispatchEvent(pointer('pointerdown', 200, 100));
		element.dispatchEvent(pointer('pointercancel', 200, 300));
		element.dispatchEvent(pointer('pointerup', 100, 300));

		expect(onswipe).not.toHaveBeenCalled();
	});

	it('stops listening once detached', () => {
		const onswipe = vi.fn();
		attach(onswipe);
		cleanup?.();
		cleanup = undefined;

		element.dispatchEvent(pointer('pointerdown', 200, 100));
		element.dispatchEvent(pointer('pointerup', 100, 100));

		expect(onswipe).not.toHaveBeenCalled();
	});
});
