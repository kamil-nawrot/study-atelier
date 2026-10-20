import type { Era, View } from './time.ts';

export type StepKey = 'era' | '10000' | '1000' | '300' | '100' | '30';

export const STEP_KEYS: readonly StepKey[] = ['era', '10000', '1000', '300', '100', '30'];

const STEP_YEARS: Record<Exclude<StepKey, 'era'>, number> = {
	'10000': 10000,
	'1000': 1000,
	'300': 300,
	'100': 100,
	'30': 30
};

export const ERA_MARGIN = 0.02;

const NARROWER_THAN_ERA = 0.8;

export function eraLength(era: Era): number {
	return era.end - era.start;
}

export function availableSteps(era: Era): StepKey[] {
	return STEP_KEYS.filter(
		(key) => key === 'era' || STEP_YEARS[key] < eraLength(era) * NARROWER_THAN_ERA
	);
}

export function stepSpan(key: StepKey, era: Era): number {
	return key === 'era' ? eraLength(era) * (1 + 2 * ERA_MARGIN) : STEP_YEARS[key];
}

export function clampCenter(center: number, span: number, era: Era): number {
	const margin = eraLength(era) * ERA_MARGIN;
	const low = era.start - margin + span / 2;
	const high = era.end + margin - span / 2;
	if (low > high) return (era.start + era.end) / 2;
	return Math.min(Math.max(center, low), high);
}

export function eraView(era: Era): View {
	return { center: (era.start + era.end) / 2, span: stepSpan('era', era) };
}

export function stepView(view: View, key: StepKey, era: Era, anchor = 0.5): View {
	if (key === 'era') return eraView(era);
	const span = stepSpan(key, era);
	const anchorTime = view.center - view.span / 2 + anchor * view.span;
	return { center: clampCenter(anchorTime - (anchor - 0.5) * span, span, era), span };
}

export function nextStep(current: StepKey, era: Era, direction: 1 | -1): StepKey {
	const steps = availableSteps(era);
	const index = steps.indexOf(current);
	const from = index < 0 ? 0 : index;
	return steps[Math.min(Math.max(from + direction, 0), steps.length - 1)];
}

export function panView(view: View, by: number, era: Era): View {
	return { center: clampCenter(view.center + by, view.span, era), span: view.span };
}
