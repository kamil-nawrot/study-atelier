import type { Attachment } from 'svelte/attachments';

export const DROP_UP = 'data-drop-up';

function floorBelow(anchor: DOMRect): number {
	const visible = window.visualViewport;
	let floor = visible
		? Math.min(window.innerHeight, visible.offsetTop + visible.height)
		: window.innerHeight;
	for (const bar of document.querySelectorAll<HTMLElement>('[data-action-bar]')) {
		const top = bar.getBoundingClientRect().top;
		if (top >= anchor.bottom && top < floor) floor = top;
	}
	return floor;
}

function ceilingAbove(list: HTMLElement): number {
	return parseFloat(getComputedStyle(list).getPropertyValue('--bar-height')) || 0;
}

export function placeDrop(list: HTMLElement): void {
	list.removeAttribute(DROP_UP);
	for (const property of ['top', 'bottom', 'max-height']) list.style.removeProperty(property);
	const parent = list.offsetParent;
	if (!parent) return;
	const anchor = parent.getBoundingClientRect();
	const own = list.getBoundingClientRect();
	const gap = own.top - anchor.bottom;
	const below = floorBelow(anchor) - anchor.bottom - gap;
	if (own.height <= below) return;
	const above = anchor.top - ceilingAbove(list) - gap;
	const up = above > below;
	if (up) {
		list.setAttribute(DROP_UP, '');
		list.style.top = 'auto';
		const border = parseFloat(getComputedStyle(parent).borderBottomWidth) || 0;
		list.style.bottom = `${anchor.height - border + gap}px`;
	}
	const room = Math.floor(up ? above : below);
	if (own.height > room) list.style.maxHeight = `${Math.max(room, 0)}px`;
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
		window.addEventListener('resize', place);
		window.visualViewport?.addEventListener('resize', place);
		window.addEventListener('scroll', place, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			items.disconnect();
			window.removeEventListener('resize', place);
			window.visualViewport?.removeEventListener('resize', place);
			window.removeEventListener('scroll', place);
		};
	};
}
