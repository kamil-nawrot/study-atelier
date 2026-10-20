import { describe, expect, it } from 'vitest';
import {
	availableSteps,
	clampCenter,
	eraView,
	focusView,
	nextStep,
	panView,
	stepSpan,
	stepView
} from './scale.ts';
import { eraOf } from './time.ts';

const earlyModern = eraOf('early_modern', 2026);
const prehistory = eraOf('prehistory', 2026);

describe('availableSteps', () => {
	it('offers only the steps narrower than most of the era', () => {
		expect(availableSteps(earlyModern)).toEqual(['era', '100', '30']);
		expect(availableSteps(prehistory)).toEqual(['era', '10000', '1000', '300', '100', '30']);
		expect(availableSteps(eraOf('contemporary', 2026))).toEqual(['era', '30']);
	});
});

describe('stepView', () => {
	it('shows the whole era with a margin on each side at the era step', () => {
		expect(eraView(earlyModern)).toEqual({ center: 1640.5, span: stepSpan('era', earlyModern) });
		expect(stepSpan('era', earlyModern)).toBeCloseTo(297 * 1.04);
	});

	it('keeps the time under the anchor in place when the step changes', () => {
		const view = { center: 1640, span: 300 };
		const next = stepView(view, '100', earlyModern, 0.25);
		const anchorBefore = view.center - view.span / 2 + 0.25 * view.span;
		const anchorAfter = next.center - next.span / 2 + 0.25 * next.span;
		expect(next.span).toBe(100);
		expect(anchorAfter).toBeCloseTo(anchorBefore);
	});

	it('moves one step at a time and stops at both ends', () => {
		expect(nextStep('era', earlyModern, 1)).toBe('100');
		expect(nextStep('30', earlyModern, 1)).toBe('30');
		expect(nextStep('era', earlyModern, -1)).toBe('era');
		expect(nextStep('1000', earlyModern, -1)).toBe('era');
	});
});

describe('clampCenter and panView', () => {
	it('stops the view at the era bounds and its margin', () => {
		const margin = 297 * 0.02;
		expect(clampCenter(1000, 100, earlyModern)).toBeCloseTo(1492 - margin + 50);
		expect(panView({ center: 1700, span: 100 }, 500, earlyModern).center).toBeCloseTo(
			1789 + margin - 50
		);
	});

	it('centres a view wider than the era', () => {
		expect(clampCenter(0, 1000, earlyModern)).toBe(1640.5);
	});
});

describe('focusView', () => {
	it('shows an event at the closest step that holds it whole', () => {
		expect(focusView(earlyModern, { start: 1618, end: 1649 })).toEqual({
			step: '100',
			view: { center: 1633.5, span: 100 }
		});
		expect(focusView(earlyModern, { start: 1648, end: 1649 }).step).toBe('30');
		expect(focusView(earlyModern, { start: 1492, end: 1789 }).step).toBe('era');
	});
});
