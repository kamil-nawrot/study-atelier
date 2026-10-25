import type { Attachment } from 'svelte/attachments';
import type { View } from '#lib/timeline/types/view.ts';

const DRAG_THRESHOLD = 6;
const PINCH_STEP = 1.4;
const WHEEL_STEP = 60;
const WHEEL_PAUSE_MS = 380;

export type StageGestureContext = {
	vertical: boolean;
	view: View;
	length: number;
	onpan: (by: number) => void;
	onstep: (direction: 1 | -1, anchor?: number) => void;
	onsettle?: () => void;
	onbackground?: () => void;
};

function insideControl(target: EventTarget | null): boolean {
	return target instanceof Element && target.closest('button, a') !== null;
}

export function stageGestures(context: () => StageGestureContext): Attachment<HTMLElement> {
	return (stage) => {
		const pointers = new Map<number, { x: number; y: number }>();
		let drag: { id: number; at: number; center: number; moved: boolean } | null = null;
		let pinch: { distance: number } | null = null;
		let suppressClick = false;
		let wheelTotal = 0;
		let wheelPausedUntil = 0;

		const along = (point: { clientX: number; clientY: number }): number =>
			context().vertical ? point.clientY : point.clientX;

		const anchorOf = (at: number): number => {
			const box = stage.getBoundingClientRect();
			const vertical = context().vertical;
			const extent = vertical ? box.height : box.width;
			if (extent === 0) return 0.5;
			return Math.min(Math.max((at - (vertical ? box.top : box.left)) / extent, 0), 1);
		};

		const distance = (): number => {
			const [a, b] = [...pointers.values()];
			return Math.hypot(a.x - b.x, a.y - b.y);
		};

		const pointerDown = (event: PointerEvent): void => {
			suppressClick = false;
			if (!insideControl(event.target))
				stage.querySelector<HTMLElement>('[role="slider"]')?.focus({ preventScroll: true });
			pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
			if (pointers.size === 1) {
				context().onsettle?.();
				drag = {
					id: event.pointerId,
					at: along(event),
					center: context().view.center,
					moved: false
				};
			} else if (pointers.size === 2) {
				drag = null;
				pinch = { distance: distance() };
			}
		};

		const pinchMove = (current: { distance: number }): void => {
			const [a, b] = [...pointers.values()];
			const ratio = distance() / current.distance;
			const anchor = anchorOf(context().vertical ? (a.y + b.y) / 2 : (a.x + b.x) / 2);
			if (ratio > PINCH_STEP) {
				context().onstep(1, anchor);
				pinch = { distance: distance() };
			} else if (ratio < 1 / PINCH_STEP) {
				context().onstep(-1, anchor);
				pinch = { distance: distance() };
			}
		};

		const pointerMove = (event: PointerEvent): void => {
			if (!pointers.has(event.pointerId)) return;
			pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
			if (pinch && pointers.size === 2) {
				pinchMove(pinch);
				return;
			}
			if (!drag || drag.id !== event.pointerId) return;
			const moved = along(event) - drag.at;
			if (!drag.moved && Math.abs(moved) < DRAG_THRESHOLD) return;
			if (!drag.moved) {
				drag.moved = true;
				if (!stage.hasPointerCapture(event.pointerId) && event.isTrusted)
					stage.setPointerCapture(event.pointerId);
			}
			const { view, length } = context();
			context().onpan(drag.center - (moved / Math.max(length, 1)) * view.span - view.center);
		};

		const pointerUp = (event: PointerEvent): void => {
			pointers.delete(event.pointerId);
			if (drag?.id === event.pointerId) {
				if (drag.moved && event.type !== 'pointercancel') suppressClick = true;
				drag = null;
			}
			if (pointers.size < 2) pinch = null;
		};

		const backgroundClick = (event: MouseEvent): void => {
			if (insideControl(event.target)) return;
			context().onbackground?.();
		};

		const clickCapture = (event: MouseEvent): void => {
			if (!suppressClick) return;
			suppressClick = false;
			event.stopPropagation();
			event.preventDefault();
		};

		const wheel = (event: WheelEvent): void => {
			event.preventDefault();
			const { view, length, onpan, onstep, onsettle } = context();
			if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
				onsettle?.();
				const by = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
				onpan((by / Math.max(length, 1)) * view.span);
				return;
			}
			const now = performance.now();
			if (now < wheelPausedUntil) return;
			wheelTotal += event.deltaY;
			if (Math.abs(wheelTotal) < WHEEL_STEP) return;
			onstep(wheelTotal < 0 ? 1 : -1, anchorOf(along(event)));
			wheelTotal = 0;
			wheelPausedUntil = now + WHEEL_PAUSE_MS;
		};

		const keydown = (event: KeyboardEvent): void => {
			if (event.key !== 'Escape') return;
			context().onbackground?.();
			event.preventDefault();
		};

		const listeners: [string, EventListener, AddEventListenerOptions?][] = [
			['wheel', wheel as EventListener, { passive: false }],
			['click', backgroundClick as EventListener],
			['click', clickCapture as EventListener, { capture: true }],
			['keydown', keydown as EventListener],
			['pointerdown', pointerDown as EventListener],
			['pointermove', pointerMove as EventListener],
			['pointerup', pointerUp as EventListener],
			['pointercancel', pointerUp as EventListener]
		];
		for (const [type, listener, options] of listeners)
			stage.addEventListener(type, listener, options);
		return () => {
			for (const [type, listener, options] of listeners)
				stage.removeEventListener(type, listener, options);
		};
	};
}
