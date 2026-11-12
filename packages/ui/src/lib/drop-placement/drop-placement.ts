import type { Attachment } from 'svelte/attachments';

export const DROP_UP = 'data-drop-up';
export const DROP_OVER = 'data-drop-over';

const MIN_ROOM = 120;
const BOTTOM_BARS = '[data-action-bar], [data-bottom-bar]';
const SCROLLING = /(auto|scroll|hidden|clip)/;

export type Band = { top: number; bottom: number };

function scrollBox(element: Element): Element | null {
	for (let node = element.parentElement; node; node = node.parentElement) {
		if (node === document.body || node === document.documentElement) return null;
		if (SCROLLING.test(getComputedStyle(node).overflowY)) return node;
		if (node instanceof HTMLDialogElement) return node;
	}
	return null;
}

export function screenBand(
	anchor: Element,
	field: DOMRect,
	scrolling = false,
	styled: Element = anchor
): Band {
	const visible = window.visualViewport;
	const band: Band = visible
		? {
				top: Math.max(visible.offsetTop, 0),
				bottom: Math.min(window.innerHeight, visible.offsetTop + visible.height)
			}
		: { top: 0, bottom: window.innerHeight };
	const dialog = anchor.closest('dialog');
	if (!dialog) {
		const bar = parseFloat(getComputedStyle(styled).getPropertyValue('--bar-height')) || 0;
		band.top = Math.max(band.top, bar);
	}
	const box = scrolling ? scrollBox(anchor) : null;
	if (box) {
		const rect = box.getBoundingClientRect();
		band.top = Math.max(band.top, rect.top);
		band.bottom = Math.min(band.bottom, rect.bottom);
	}
	for (const bar of document.querySelectorAll<HTMLElement>(BOTTOM_BARS)) {
		if (dialog ? !dialog.contains(bar) : bar.closest('dialog')) continue;
		const rect = bar.getBoundingClientRect();
		if (rect.height > 0 && rect.top > field.top && rect.top < band.bottom) band.bottom = rect.top;
	}
	return band;
}

function clear(list: HTMLElement): void {
	list.removeAttribute(DROP_UP);
	list.removeAttribute(DROP_OVER);
	for (const property of ['top', 'bottom', 'max-height']) list.style.removeProperty(property);
}

export function placeDrop(list: HTMLElement): void {
	clear(list);
	const parent = list.offsetParent;
	if (!parent) return;
	const anchor = parent.getBoundingClientRect();
	const own = list.getBoundingClientRect();
	const gap = own.top - anchor.bottom;
	const band = screenBand(parent, anchor, true, list);
	const below = band.bottom - anchor.bottom - gap;
	if (own.height <= below) return;
	const above = anchor.top - band.top - gap;
	const room = Math.floor(Math.max(above, below));
	const border = parseFloat(getComputedStyle(parent).borderBottomWidth) || 0;
	const borderTop = parseFloat(getComputedStyle(parent).borderTopWidth) || 0;
	if (room < Math.min(own.height, MIN_ROOM)) {
		const height = Math.min(own.height, Math.max(band.bottom - band.top, 0));
		list.setAttribute(DROP_OVER, '');
		list.style.top = `${band.bottom - height - anchor.top - borderTop}px`;
		if (own.height > height) list.style.maxHeight = `${height}px`;
		return;
	}
	if (above > below) {
		list.setAttribute(DROP_UP, '');
		list.style.top = 'auto';
		list.style.bottom = `${anchor.height - border + gap}px`;
	}
	if (own.height > room) list.style.maxHeight = `${room}px`;
}

export function dropPlacement(): Attachment<HTMLElement> {
	return (list) => {
		let frame = 0;
		const place = (): void => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => placeDrop(list));
		};
		const observer = new ResizeObserver(place);
		observer.observe(list);
		const items = new MutationObserver(place);
		items.observe(list, { childList: true, attributes: true, attributeFilter: ['hidden'] });
		const scroll = { capture: true, passive: true };
		window.addEventListener('resize', place);
		document.addEventListener('scroll', place, scroll);
		window.visualViewport?.addEventListener('resize', place);
		window.visualViewport?.addEventListener('scroll', place);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			items.disconnect();
			window.removeEventListener('resize', place);
			document.removeEventListener('scroll', place, scroll);
			window.visualViewport?.removeEventListener('resize', place);
			window.visualViewport?.removeEventListener('scroll', place);
		};
	};
}
