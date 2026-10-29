import { nextStep, panView, stepView } from '#lib/timeline/scale/scale.ts';
import type { Era } from '#lib/timeline/types/era.ts';
import type { StepKey } from '#lib/timeline/types/step-key.ts';
import type { View } from '#lib/timeline/types/view.ts';

const STEP_ANIMATION_MS = 400;

function reducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function eased(progress: number): number {
	return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

export class TimelineCamera {
	step = $state<StepKey>('era');
	target = $state<View>({ center: 0, span: 1 });
	view = $state<View>({ center: 0, span: 1 });

	#frame = 0;
	readonly #era: () => Era;

	constructor(start: { step: StepKey; view: View }, era: () => Era) {
		this.#era = era;
		this.step = start.step;
		this.target = start.view;
		this.view = start.view;
	}

	stop(): void {
		if (this.#frame) cancelAnimationFrame(this.#frame);
		this.#frame = 0;
	}

	showNow(next: View): void {
		this.stop();
		this.target = next;
		this.view = next;
	}

	animateTo(next: View): void {
		this.target = next;
		if (reducedMotion()) {
			this.showNow(next);
			return;
		}
		this.stop();
		const from = this.view;
		const started = performance.now();
		const tick = (now: number): void => {
			const progress = Math.min(1, (now - started) / STEP_ANIMATION_MS);
			const share = eased(progress);
			this.view = {
				center: from.center + (next.center - from.center) * share,
				span: Math.exp(Math.log(from.span) + (Math.log(next.span) - Math.log(from.span)) * share)
			};
			this.#frame = progress < 1 ? requestAnimationFrame(tick) : 0;
		};
		this.#frame = requestAnimationFrame(tick);
	}

	chooseStep(key: StepKey, anchor = 0.5): void {
		this.step = key;
		this.animateTo(stepView(this.target, key, this.#era(), anchor));
	}

	moveStep(direction: 1 | -1, anchor = 0.5): void {
		const key = nextStep(this.step, this.#era(), direction);
		if (key !== this.step) this.chooseStep(key, anchor);
	}

	settle(): void {
		if (this.#frame) this.showNow(this.target);
	}

	pan(by: number): void {
		this.showNow(panView(this.target, by, this.#era()));
	}

	panShare(share: number): void {
		this.pan(share * this.target.span);
	}
}
