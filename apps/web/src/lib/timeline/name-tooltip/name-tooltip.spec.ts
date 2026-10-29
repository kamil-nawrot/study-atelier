import { describe, expect, it } from 'vitest';
import { nameTooltipAlign } from './name-tooltip.ts';

describe('name tooltip', () => {
	it('opens towards the middle from where a name inside its ribbon starts', () => {
		expect(nameTooltipAlign({ from: 100, to: 300, inside: true }, 1000, false)).toBe('start');
		expect(nameTooltipAlign({ from: 700, to: 900, inside: true }, 1000, false)).toBe('end');
	});

	it('takes the end of a short ribbon for a name that stands after it', () => {
		expect(nameTooltipAlign({ from: 450, to: 560, inside: false }, 1000, false)).toBe('end');
		expect(nameTooltipAlign({ from: 450, to: 480, inside: false }, 1000, false)).toBe('start');
	});

	it('always opens downwards along a vertical timeline', () => {
		expect(nameTooltipAlign({ from: 900, to: 950, inside: false }, 1000, true)).toBe('start');
	});
});
