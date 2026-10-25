import { timeOf, viewStart, yearAt, type TimeSpan, type View } from '#lib/timeline/time/time.ts';

export type Unit = 100 | 1000;

export type Segment = TimeSpan & {
	number: number;
	beforeCommonEra: boolean;
};

export type AxisKind = 'years' | 'millennia' | 'centuries' | 'decades';

const YEAR_TICKS_ABOVE = 12000;
const MILLENNIA_ABOVE = 1500;
const CENTURIES_ABOVE = 120;
const FINE_DECADES_UP_TO = 60;
const CENTURY_LINE_MIN_GAP = 20;

export function segments(view: View, unit: Unit): Segment[] {
	const start = viewStart(view);
	const end = start + view.span;
	const found: Segment[] = [];
	for (let n = Math.max(1, Math.ceil((1 - end) / unit)); n <= Math.ceil((1 - start) / unit); n++) {
		const segment = {
			number: n,
			beforeCommonEra: true,
			start: -n * unit + 1,
			end: -(n - 1) * unit + 1
		};
		if (segment.end > start && segment.start < end) found.push(segment);
	}
	for (
		let n = Math.max(1, Math.floor((start - 1) / unit) + 1);
		n <= Math.ceil((end - 1) / unit);
		n++
	) {
		const segment = {
			number: n,
			beforeCommonEra: false,
			start: (n - 1) * unit + 1,
			end: n * unit + 1
		};
		if (segment.end > start && segment.start < end) found.push(segment);
	}
	return found.sort((a, b) => a.start - b.start);
}

export function axisKind(view: View): AxisKind {
	if (view.span > YEAR_TICKS_ABOVE) return 'years';
	if (view.span > MILLENNIA_ABOVE) return 'millennia';
	if (view.span > CENTURIES_ABOVE) return 'centuries';
	return 'decades';
}

export function tickYears(view: View): number[] {
	const kind = axisKind(view);
	if (kind === 'millennia' || kind === 'centuries') return [];
	const step =
		kind === 'years' ? (view.span > 30000 ? 10000 : 5000) : view.span > FINE_DECADES_UP_TO ? 10 : 5;
	const start = yearAt(viewStart(view));
	const end = yearAt(viewStart(view) + view.span);
	const years: number[] = [];
	for (let year = Math.floor(start / step) * step; year <= end + step; year += step) {
		if (year === 0) continue;
		const time = timeOf(year);
		if (time >= viewStart(view) - step && time <= viewStart(view) + view.span + step)
			years.push(year);
	}
	return years;
}

export function lineUnit(view: View, length: number): Unit {
	return (length / view.span) * 100 >= CENTURY_LINE_MIN_GAP ? 100 : 1000;
}

export function lineTimes(view: View, length: number, bounds: TimeSpan): number[] {
	return segments(view, lineUnit(view, length))
		.map((segment) => segment.start)
		.filter((time) => time > bounds.start && time < bounds.end);
}
