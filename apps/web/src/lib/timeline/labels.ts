import { m } from '#lib/i18n/index.ts';
import { axisKind, type Segment } from './axis.ts';
import { viewStart, yearAt, type TimeSpan, type View } from './time.ts';

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

function unitOf(year: number, unit: number): { number: number; beforeCommonEra: boolean } {
	return year > 0
		? { number: Math.ceil(year / unit), beforeCommonEra: false }
		: { number: Math.ceil(-year / unit), beforeCommonEra: true };
}

function range(
	first: { number: number; beforeCommonEra: boolean },
	last: { number: number; beforeCommonEra: boolean },
	label: (numeral: string, beforeCommonEra: boolean) => string,
	short: (from: string, to: string, beforeCommonEra: boolean) => string
): string {
	if (first.number === last.number && first.beforeCommonEra === last.beforeCommonEra)
		return label(roman(first.number), first.beforeCommonEra);
	if (first.beforeCommonEra === last.beforeCommonEra)
		return short(roman(first.number), roman(last.number), first.beforeCommonEra);
	return m.atelier.yearRange(
		label(roman(first.number), first.beforeCommonEra),
		label(roman(last.number), last.beforeCommonEra)
	);
}

export function seenRange(view: View, bounds: TimeSpan): string {
	const first = yearAt(Math.max(viewStart(view), bounds.start));
	const last = yearAt(Math.min(viewStart(view) + view.span, bounds.end) - 0.001);
	const kind = axisKind(view);
	if (kind === 'years')
		return m.atelier.yearRange(m.atelier.year(first, false), m.atelier.year(last, false));
	if (kind === 'millennia')
		return range(
			unitOf(first, 1000),
			unitOf(last, 1000),
			m.timeline.millenniumShort,
			m.timeline.millenniaRange
		);
	if (kind === 'centuries')
		return range(
			unitOf(first, 100),
			unitOf(last, 100),
			m.timeline.century,
			m.timeline.centuriesRange
		);
	return m.atelier.span(first, last, false);
}
