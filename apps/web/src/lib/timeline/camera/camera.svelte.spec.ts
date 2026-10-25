import { afterEach, describe, expect, it } from 'vitest';
import { eraView, stepView } from '#lib/timeline/scale/scale.ts';
import { eraOf } from '#lib/timeline/time/time.ts';
import { TimelineCamera } from './camera.svelte.ts';

const era = eraOf('early_modern', 2026);

describe('timeline camera', () => {
	let camera: TimelineCamera | undefined;

	afterEach(() => camera?.stop());

	it('starts at the given step and view', () => {
		camera = new TimelineCamera({ step: 'era', view: eraView(era) }, () => era);

		expect(camera.step).toBe('era');
		expect(camera.view).toEqual(eraView(era));
		expect(camera.target).toEqual(eraView(era));
	});

	it('aims at the next step and lands there when settled', () => {
		camera = new TimelineCamera({ step: 'era', view: eraView(era) }, () => era);

		camera.moveStep(1);
		camera.settle();

		expect(camera.step).toBe('100');
		expect(camera.target).toEqual(stepView(eraView(era), '100', era));
		expect(camera.view).toEqual(camera.target);
	});

	it('stays at the widest step when moving out from the era', () => {
		camera = new TimelineCamera({ step: 'era', view: eraView(era) }, () => era);

		camera.moveStep(-1);

		expect(camera.step).toBe('era');
	});

	it('pans by a share of the shown span at once', () => {
		const start = stepView(eraView(era), '100', era);
		camera = new TimelineCamera({ step: '100', view: start }, () => era);

		camera.panShare(0.1);

		expect(camera.view.center).toBeCloseTo(start.center + start.span * 0.1);
		expect(camera.view).toEqual(camera.target);
	});
});
