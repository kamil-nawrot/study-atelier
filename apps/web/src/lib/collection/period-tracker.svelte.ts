import { currentPeriod, monotone, referenceLine } from './period-rail.ts';
import type { CurrentPeriod } from './types.ts';

export const MIN_RAIL_MARGIN = 128;

export class PeriodTracker {
	current = $state<CurrentPeriod>({ index: 0, progress: 0 });
	margin = $state(0);

	#starts: number[] = [];
	#end = 0;
	#frame = 0;

	track(wall: HTMLElement, topInset: number): () => void {
		const place = (): void => {
			this.#frame = 0;
			const reference = referenceLine(
				window.scrollY,
				window.innerHeight,
				document.documentElement.scrollHeight,
				topInset
			);
			this.current = currentPeriod(this.#starts, this.#end, reference);
		};

		const schedule = (): void => {
			if (this.#frame === 0) this.#frame = requestAnimationFrame(place);
		};

		const measure = (): void => {
			const starts: number[] = [];
			let end = 0;
			for (const tile of wall.querySelectorAll<HTMLElement>('[data-period]')) {
				const index = Number(tile.dataset.period);
				const { top, bottom } = tile.getBoundingClientRect();
				starts[index] = Math.min(starts[index] ?? Infinity, top + window.scrollY);
				end = Math.max(end, bottom + window.scrollY);
			}
			this.#starts = monotone(Array.from(starts, (start) => start ?? Infinity));
			this.#end = end;
			this.margin = document.documentElement.clientWidth - wall.getBoundingClientRect().right;
			place();
		};

		const resizes = new ResizeObserver(measure);
		const changes = new MutationObserver(measure);
		resizes.observe(wall);
		changes.observe(wall, { childList: true, subtree: true });
		window.addEventListener('resize', measure);
		window.addEventListener('scroll', schedule, { passive: true });
		measure();

		return () => {
			resizes.disconnect();
			changes.disconnect();
			window.removeEventListener('resize', measure);
			window.removeEventListener('scroll', schedule);
			cancelAnimationFrame(this.#frame);
			this.#frame = 0;
		};
	}
}
