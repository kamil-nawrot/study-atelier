import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';

export type PlacedDetail = { detail: SymbolDetail; left: number };

export type SymbolTimeline = {
	ticks: { year: number; left: number }[];
	placed: PlacedDetail[];
};

const CENTURY = 100;

export function symbolTimeline(details: readonly SymbolDetail[]): SymbolTimeline | undefined {
	const dated = details.filter(
		(detail): detail is SymbolDetail & { year: number } => detail.year !== null
	);
	if (dated.length === 0) return undefined;
	const years = dated.map((detail) => detail.year);
	const from = Math.floor(Math.min(...years) / CENTURY) * CENTURY;
	const to = Math.max(Math.ceil(Math.max(...years) / CENTURY) * CENTURY, from + CENTURY);
	const left = (year: number): number => (100 * (year - from)) / (to - from);
	const ticks = [];
	for (let year = from; year <= to; year += CENTURY) ticks.push({ year, left: left(year) });
	return {
		ticks,
		placed: [...dated]
			.sort((a, b) => a.year - b.year)
			.map((detail) => ({ detail, left: left(detail.year) }))
	};
}
