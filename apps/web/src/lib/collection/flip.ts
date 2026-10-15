import type { Attachment } from 'svelte/attachments';
import type { FlipDirection } from './types.ts';

export const FLIP_DIRECTIONS: readonly FlipDirection[] = ['previous', 'next'];

export const SWIPE_DISTANCE = 48;

const TYPING_TARGETS = 'input, textarea, select, dialog';

export function swipeDirection(dx: number, dy: number): FlipDirection | undefined {
	if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < 2 * Math.abs(dy)) return undefined;
	return dx < 0 ? 'next' : 'previous';
}

export function keyDirection(event: KeyboardEvent): FlipDirection | undefined {
	if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
		return undefined;
	const { target } = event;
	if (target instanceof Element && target.closest(TYPING_TARGETS)) return undefined;
	if (target instanceof HTMLElement && target.isContentEditable) return undefined;
	if (event.key === 'ArrowLeft') return 'previous';
	if (event.key === 'ArrowRight') return 'next';
	return undefined;
}

export function swipe(onswipe: (direction: FlipDirection) => void): Attachment<HTMLElement> {
	return (element) => {
		let start: { id: number; x: number; y: number } | undefined;

		const down = (event: PointerEvent): void => {
			if (event.pointerType !== 'touch' || !event.isPrimary) return;
			start = { id: event.pointerId, x: event.clientX, y: event.clientY };
		};
		const up = (event: PointerEvent): void => {
			if (!start || event.pointerId !== start.id) return;
			const direction = swipeDirection(event.clientX - start.x, event.clientY - start.y);
			start = undefined;
			if (direction) onswipe(direction);
		};
		const cancel = (): void => {
			start = undefined;
		};

		element.addEventListener('pointerdown', down);
		element.addEventListener('pointerup', up);
		element.addEventListener('pointercancel', cancel);
		return () => {
			element.removeEventListener('pointerdown', down);
			element.removeEventListener('pointerup', up);
			element.removeEventListener('pointercancel', cancel);
		};
	};
}
