import type { Attachment } from 'svelte/attachments';
import { swipeDirection } from '#lib/wall/flip/flip.ts';
import type { FlipDirection } from '#lib/wall/types/flip-direction.ts';

export const MAX_SCALE = 5;
export const TAP_SCALE = 2.5;

const DOUBLE_TAP_MS = 300;
const TAP_DISTANCE = 24;

type Point = { x: number; y: number };
type Size = { width: number; height: number };

export type View = { scale: number; x: number; y: number };

export const AT_REST: View = { scale: 1, x: 0, y: 0 };

function clamp(value: number, low: number, high: number): number {
	return Math.min(Math.max(value, low), high) || 0;
}

export function bounded(view: View, image: Size, frame: Size): View {
	const scale = clamp(view.scale, 1, MAX_SCALE);
	const reachX = Math.max(0, (image.width * scale - frame.width) / 2);
	const reachY = Math.max(0, (image.height * scale - frame.height) / 2);
	return { scale, x: clamp(view.x, -reachX, reachX), y: clamp(view.y, -reachY, reachY) };
}

export function pinched(
	start: View,
	from: [Point, Point],
	to: [Point, Point],
	centre: Point
): View {
	const distance = (pair: [Point, Point]): number =>
		Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1;
	const middle = (pair: [Point, Point]): Point => ({
		x: (pair[0].x + pair[1].x) / 2,
		y: (pair[0].y + pair[1].y) / 2
	});
	const scale = clamp((start.scale * distance(to)) / distance(from), 1, MAX_SCALE);
	const before = middle(from);
	const after = middle(to);
	const held = {
		x: (before.x - centre.x - start.x) / start.scale,
		y: (before.y - centre.y - start.y) / start.scale
	};
	return { scale, x: after.x - centre.x - held.x * scale, y: after.y - centre.y - held.y * scale };
}

export function tapped(view: View, at: Point, centre: Point): View {
	if (view.scale > 1) return AT_REST;
	return {
		scale: TAP_SCALE,
		x: (at.x - centre.x) * (1 - TAP_SCALE) || 0,
		y: (at.y - centre.y) * (1 - TAP_SCALE) || 0
	};
}

export class PinchZoom {
	view = $state<View>(AT_REST);

	zoomed = $derived(this.view.scale > 1);

	reset(): void {
		this.view = AT_REST;
	}

	attach(
		image: () => HTMLElement | undefined,
		onswipe: (direction: FlipDirection) => void
	): Attachment<HTMLElement> {
		return (frame) => {
			const pointers: Record<number, Point> = {};
			const touching = (): Point[] => Object.values(pointers);
			let start: { view: View; points: Point[] } | undefined;
			let lastTap: { at: Point; time: number } | undefined;
			let firsts: Record<number, Point> = {};
			let moved = false;
			let several = false;

			const centre = (): Point => {
				const box = frame.getBoundingClientRect();
				return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
			};
			const fit = (view: View): View => {
				const element = image();
				if (!element) return view;
				const box = frame.getBoundingClientRect();
				return bounded(
					view,
					{ width: element.offsetWidth, height: element.offsetHeight },
					{ width: box.width, height: box.height }
				);
			};
			const begin = (): void => {
				start = { view: this.view, points: touching() };
			};

			const down = (event: PointerEvent): void => {
				if (event.pointerType !== 'touch') return;
				if (event.target instanceof Element && event.target.closest('button')) return;
				const point = { x: event.clientX, y: event.clientY };
				if (touching().length === 0) {
					firsts = {};
					moved = false;
					several = false;
				}
				pointers[event.pointerId] = point;
				firsts[event.pointerId] = point;
				if (touching().length > 1) several = true;
				begin();
			};
			const move = (event: PointerEvent): void => {
				if (!(event.pointerId in pointers) || !start) return;
				pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
				const now = touching();
				const first = start.points[0];
				const origin = firsts[event.pointerId];
				if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > TAP_DISTANCE)
					moved = true;
				if (now.length >= 2 && start.points.length >= 2) {
					this.view = fit(
						pinched(start.view, [start.points[0], start.points[1]], [now[0], now[1]], centre())
					);
				} else if (now.length === 1 && start.view.scale > 1) {
					this.view = fit({
						...start.view,
						x: start.view.x + now[0].x - first.x,
						y: start.view.y + now[0].y - first.y
					});
				}
			};
			const tap = (point: Point, time: number): void => {
				const near =
					lastTap && Math.hypot(point.x - lastTap.at.x, point.y - lastTap.at.y) <= 2 * TAP_DISTANCE;
				if (lastTap && near && time - lastTap.time < DOUBLE_TAP_MS) {
					this.view = fit(tapped(this.view, point, centre()));
					lastTap = undefined;
				} else {
					lastTap = { at: point, time };
				}
			};
			const up = (event: PointerEvent): void => {
				const point = pointers[event.pointerId];
				if (!point || !start) return;
				const single = !several && touching().length === 1 && start.points.length === 1;
				const first = start.points[0];
				delete pointers[event.pointerId];
				if (single && !this.zoomed && moved) {
					const direction = swipeDirection(point.x - first.x, point.y - first.y);
					if (direction) onswipe(direction);
				}
				if (single && !moved) tap(point, event.timeStamp);
				if (touching().length > 0) begin();
				else start = undefined;
			};
			const cancel = (event: PointerEvent): void => {
				delete pointers[event.pointerId];
				if (touching().length > 0) begin();
				else start = undefined;
			};

			frame.addEventListener('pointerdown', down);
			frame.addEventListener('pointermove', move);
			frame.addEventListener('pointerup', up);
			frame.addEventListener('pointercancel', cancel);
			return () => {
				frame.removeEventListener('pointerdown', down);
				frame.removeEventListener('pointermove', move);
				frame.removeEventListener('pointerup', up);
				frame.removeEventListener('pointercancel', cancel);
			};
		};
	}
}
