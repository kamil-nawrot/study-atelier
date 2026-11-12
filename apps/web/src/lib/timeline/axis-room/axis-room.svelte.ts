import type { Attachment } from 'svelte/attachments';

export const AXIS_GAP = 8;

export function roomBelow(element: HTMLElement): number {
	const top = element.getBoundingClientRect().top + window.scrollY;
	const bar = document.querySelector<HTMLElement>('[data-bottom-bar]');
	const covered = bar ? bar.getBoundingClientRect().height : 0;
	return Math.max(0, Math.floor(document.documentElement.clientHeight - top - covered - AXIS_GAP));
}

export class AxisRoom {
	room = $state(0);

	attach(): Attachment<HTMLElement> {
		return (element) => {
			const measure = (): void => {
				this.room = roomBelow(element);
			};
			measure();
			const observer = new ResizeObserver(measure);
			if (element.parentElement) observer.observe(element.parentElement);
			window.addEventListener('resize', measure);
			return () => {
				observer.disconnect();
				window.removeEventListener('resize', measure);
			};
		};
	}
}
