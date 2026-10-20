import { m } from '#lib/i18n/index.ts';
import type { Segment } from './axis.ts';

const NUMERALS: readonly [number, string][] = [
	[1000, 'M'],
	[900, 'CM'],
	[500, 'D'],
	[400, 'CD'],
	[100, 'C'],
	[90, 'XC'],
	[50, 'L'],
	[40, 'XL'],
	[10, 'X'],
	[9, 'IX'],
	[5, 'V'],
	[4, 'IV'],
	[1, 'I']
];

export function roman(value: number): string {
	let rest = value;
	let numeral = '';
	for (const [amount, letters] of NUMERALS) {
		while (rest >= amount) {
			numeral += letters;
			rest -= amount;
		}
	}
	return numeral;
}

export function segmentLabel(segment: Segment, unit: 100 | 1000): string {
	return unit === 1000
		? m.timeline.millennium(roman(segment.number), segment.beforeCommonEra)
		: m.timeline.century(roman(segment.number), segment.beforeCommonEra);
}
