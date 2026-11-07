export type DragHandlers = {
	onstart: () => void;
	onmove: (x: number, y: number) => void;
	ondrop: (x: number, y: number) => void;
	onend: () => void;
};

type Pending = DragHandlers & {
	label: string;
	startX: number;
	startY: number;
	pointerId: number;
};

export const START_DISTANCE = 4;

export const EDGE = 72;

const MAX_STEP = 24;

export function edgeStep(y: number, top: number, bottom: number): number {
	if (y < top + EDGE) return -Math.ceil(((top + EDGE - y) / EDGE) * MAX_STEP);
	if (y > bottom - EDGE) return Math.ceil(((y - (bottom - EDGE)) / EDGE) * MAX_STEP);
	return 0;
}

export class BlockDrag {
	label = $state<string>();
	x = $state(0);
	y = $state(0);
	#pending: Pending | undefined;
	#started = false;
	#frame = 0;
	#top: () => number;

	constructor(top: () => number = () => 0) {
		this.#top = top;
	}

	get active(): boolean {
		return this.label !== undefined;
	}

	begin(event: PointerEvent, label: string, handlers: DragHandlers): boolean {
		if (event.button !== 0 || event.pointerType === 'touch') return false;
		this.cancel();
		this.#pending = {
			...handlers,
			label,
			startX: event.clientX,
			startY: event.clientY,
			pointerId: event.pointerId
		};
		window.addEventListener('pointermove', this.#move);
		window.addEventListener('pointerup', this.#up);
		window.addEventListener('pointercancel', this.#cancelled);
		window.addEventListener('keydown', this.#key);
		window.addEventListener('scroll', this.#scrolled, { passive: true });
		return true;
	}

	cancel(): void {
		const pending = this.#pending;
		const started = this.#started;
		this.#stop();
		if (pending && started) pending.onend();
	}

	#stop(): void {
		this.#pending = undefined;
		this.#started = false;
		this.label = undefined;
		cancelAnimationFrame(this.#frame);
		window.removeEventListener('pointermove', this.#move);
		window.removeEventListener('pointerup', this.#up);
		window.removeEventListener('pointercancel', this.#cancelled);
		window.removeEventListener('keydown', this.#key);
		window.removeEventListener('scroll', this.#scrolled);
	}

	#move = (event: PointerEvent): void => {
		const pending = this.#pending;
		if (!pending || event.pointerId !== pending.pointerId) return;
		this.x = event.clientX;
		this.y = event.clientY;
		if (!this.#started) {
			const distance = Math.hypot(this.x - pending.startX, this.y - pending.startY);
			if (distance < START_DISTANCE) return;
			this.#started = true;
			this.label = pending.label;
			getSelection()?.removeAllRanges();
			pending.onstart();
			this.#frame = requestAnimationFrame(this.#scroll);
		}
		event.preventDefault();
		pending.onmove(this.x, this.y);
	};

	#up = (event: PointerEvent): void => {
		const pending = this.#pending;
		if (!pending || event.pointerId !== pending.pointerId) return;
		const started = this.#started;
		this.#stop();
		if (!started) return;
		pending.ondrop(event.clientX, event.clientY);
		pending.onend();
	};

	#cancelled = (): void => this.cancel();

	#key = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape' || !this.#started) return;
		event.preventDefault();
		this.cancel();
	};

	#scrolled = (): void => {
		if (this.#started) this.#pending?.onmove(this.x, this.y);
	};

	#scroll = (): void => {
		if (!this.#started) return;
		const step = edgeStep(this.y, this.#top(), window.innerHeight);
		if (step !== 0) window.scrollBy(0, step);
		this.#frame = requestAnimationFrame(this.#scroll);
	};
}
