import type { Attachment } from 'svelte/attachments';

export type ScrollAxis = 'y' | 'x';

export type ThumbGeometry = {
	offset: number;
	length: number;
};

const SHOW_MS = 900;
const MIN_THUMB = 24;
const PAGE_EDGE = 24;
const OVERLAY_CLASS = 'overlay-scrollbar';
const THUMB_CLASS = 'overlay-scrollbar-thumb';

export function overlaysScrollbars(): boolean {
	return (
		typeof matchMedia === 'function' &&
		matchMedia('(pointer: fine)').matches &&
		!matchMedia('(forced-colors: active)').matches
	);
}

export function thumbGeometry(
	view: number,
	full: number,
	position: number,
	minimum = MIN_THUMB
): ThumbGeometry | null {
	if (view <= 0 || full <= view + 1) return null;
	const length = Math.floor(Math.min(view, Math.max(minimum, (view / full) * view)));
	const share = Math.min(Math.max(position / (full - view), 0), 1);
	return { offset: Math.floor(share * (view - length)), length };
}

export function scrollForDrag(moved: number, view: number, full: number, length: number): number {
	const travel = view - length;
	return travel > 0 ? (moved * (full - view)) / travel : 0;
}

type Target = {
	view: () => number;
	full: () => number;
	position: () => number;
	scrollTo: (position: number) => void;
	origin: () => number;
	cross: () => number;
};

function elementTarget(scroller: HTMLElement, axis: ScrollAxis): Target {
	const vertical = axis === 'y';
	return {
		view: () => (vertical ? scroller.clientHeight : scroller.clientWidth),
		full: () => (vertical ? scroller.scrollHeight : scroller.scrollWidth),
		position: () => (vertical ? scroller.scrollTop : scroller.scrollLeft),
		scrollTo: (position) => {
			if (vertical) scroller.scrollTop = position;
			else scroller.scrollLeft = position;
		},
		origin: () => (vertical ? scroller.scrollTop : scroller.scrollLeft),
		cross: () =>
			vertical
				? scroller.scrollLeft + scroller.clientWidth
				: scroller.scrollTop + scroller.clientHeight
	};
}

function pageTarget(): Target {
	const root = document.documentElement;
	return {
		view: () => window.innerHeight,
		full: () => root.scrollHeight,
		position: () => window.scrollY,
		scrollTo: (position) => window.scrollTo(window.scrollX, position),
		origin: () => 0,
		cross: () => root.clientWidth
	};
}

function install(
	scroller: HTMLElement,
	host: HTMLElement,
	axis: ScrollAxis,
	page: boolean
): () => void {
	const target = page ? pageTarget() : elementTarget(scroller, axis);
	const vertical = axis === 'y';
	const thumb = document.createElement('div');
	thumb.className = `${THUMB_CLASS} ${axis}${page ? ' page' : ''}`;
	thumb.setAttribute('aria-hidden', 'true');
	thumb.hidden = true;
	host.appendChild(thumb);
	scroller.classList.add(OVERLAY_CLASS);
	const positioned = !page && getComputedStyle(scroller).position === 'static';
	if (positioned) scroller.style.position = 'relative';

	let frame = 0;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	const place = (): void => {
		frame = 0;
		if (!thumb.isConnected) host.appendChild(thumb);
		const geometry = thumbGeometry(target.view(), target.full(), target.position());
		thumb.hidden = geometry === null;
		if (!geometry) return;
		const along = `${target.origin() + geometry.offset}px`;
		const across = `${target.cross()}px`;
		thumb.style.setProperty(vertical ? 'top' : 'left', along);
		thumb.style.setProperty(vertical ? 'height' : 'width', `${geometry.length}px`);
		thumb.style.setProperty(vertical ? 'left' : 'top', across);
		thumb.classList.toggle(
			'inset',
			!page &&
				vertical &&
				scroller.getBoundingClientRect().right >= document.documentElement.clientWidth - 1
		);
	};

	const schedule = (): void => {
		if (!frame) frame = requestAnimationFrame(place);
	};

	const flash = (): void => {
		schedule();
		thumb.classList.add('visible');
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => thumb.classList.remove('visible'), SHOW_MS);
	};

	const enter = (event: PointerEvent): void => {
		if (event.pointerType === 'mouse') thumb.classList.add('hovered');
	};
	const leave = (): void => thumb.classList.remove('hovered');
	const nearEdge = (event: PointerEvent): void => {
		thumb.classList.toggle('hovered', window.innerWidth - event.clientX < PAGE_EDGE);
	};

	const grab = (event: PointerEvent): void => {
		event.preventDefault();
		event.stopPropagation();
		thumb.setPointerCapture?.(event.pointerId);
		thumb.classList.add('dragging');
		const start = vertical ? event.clientY : event.clientX;
		const from = target.position();
		const length = vertical ? thumb.offsetHeight : thumb.offsetWidth;
		const move = (next: PointerEvent): void => {
			const moved = (vertical ? next.clientY : next.clientX) - start;
			target.scrollTo(from + scrollForDrag(moved, target.view(), target.full(), length));
		};
		const release = (): void => {
			thumb.classList.remove('dragging');
			flash();
			thumb.removeEventListener('pointermove', move);
			thumb.removeEventListener('pointerup', release);
			thumb.removeEventListener('pointercancel', release);
		};
		thumb.addEventListener('pointermove', move);
		thumb.addEventListener('pointerup', release);
		thumb.addEventListener('pointercancel', release);
	};

	const scrolled = page ? window : scroller;
	scrolled.addEventListener('scroll', flash, { passive: true });
	thumb.addEventListener('pointerdown', grab);
	if (page) {
		document.addEventListener('pointermove', nearEdge, { passive: true });
		window.addEventListener('resize', schedule);
	} else {
		scroller.addEventListener('pointerenter', enter);
		scroller.addEventListener('pointerleave', leave);
	}
	const resized = new ResizeObserver(schedule);
	resized.observe(page ? document.body : scroller);
	const changed = new MutationObserver(schedule);
	changed.observe(page ? document.body : scroller, {
		childList: true,
		subtree: true,
		characterData: true
	});
	schedule();

	return () => {
		cancelAnimationFrame(frame);
		clearTimeout(hideTimer);
		resized.disconnect();
		changed.disconnect();
		scrolled.removeEventListener('scroll', flash);
		thumb.removeEventListener('pointerdown', grab);
		document.removeEventListener('pointermove', nearEdge);
		window.removeEventListener('resize', schedule);
		scroller.removeEventListener('pointerenter', enter);
		scroller.removeEventListener('pointerleave', leave);
		scroller.classList.remove(OVERLAY_CLASS);
		if (positioned) scroller.style.removeProperty('position');
		thumb.remove();
	};
}

export function overlayScrollbar(axis: ScrollAxis = 'y'): Attachment<HTMLElement> {
	return (node) => (overlaysScrollbars() ? install(node, node, axis, false) : undefined);
}

export function pageScrollbar(): (() => void) | undefined {
	if (!overlaysScrollbars()) return undefined;
	return install(document.documentElement, document.body, 'y', true);
}
