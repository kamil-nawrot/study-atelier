import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';

export type PlacedDetail = { detail: SymbolDetail; left: number };

export type SymbolTimeline = {
	ticks: { year: number; left: number }[];
	breaks: number[];
	placed: PlacedDetail[];
};

type Cluster = { from: number; to: number; years: number[] };

const CENTURY = 100;
const GAP = 500;
const BREAK_WIDTH = 200;
const MAX_TICKS = 12;
const TICK_STEPS = [CENTURY, 500, 1000, 5000, 10000, 50000, 100000];

function clusterOf(years: number[]): Cluster {
	const from = Math.floor(years[0] / CENTURY) * CENTURY;
	const to = Math.max(Math.ceil(years[years.length - 1] / CENTURY) * CENTURY, from + CENTURY);
	return { from, to, years };
}

function clusters(years: readonly number[]): Cluster[] {
	const sorted = [...years].sort((a, b) => a - b);
	const groups: number[][] = [[sorted[0]]];
	for (const year of sorted.slice(1)) {
		const group = groups[groups.length - 1];
		if (year - group[group.length - 1] > GAP) groups.push([year]);
		else group.push(year);
	}
	return groups.map(clusterOf);
}

function tickStep(cluster: Cluster): number {
	const span = cluster.to - cluster.from;
	return TICK_STEPS.find((step) => span / step <= MAX_TICKS) ?? TICK_STEPS[TICK_STEPS.length - 1];
}

export function symbolTimeline(details: readonly SymbolDetail[]): SymbolTimeline | undefined {
	const dated = details.filter(
		(detail): detail is SymbolDetail & { year: number } => detail.year !== null
	);
	if (dated.length === 0) return undefined;
	const parts = clusters(dated.map((detail) => detail.year));
	const total =
		parts.reduce((sum, cluster) => sum + (cluster.to - cluster.from), 0) +
		BREAK_WIDTH * (parts.length - 1);
	const ticks: SymbolTimeline['ticks'] = [];
	const breaks: number[] = [];
	const lefts = new Map<number, number>();
	let offset = 0;
	for (const [index, cluster] of parts.entries()) {
		const unit = (year: number): number => (100 * (offset + year - cluster.from)) / total;
		const step = tickStep(cluster);
		for (let year = cluster.from; year <= cluster.to; year += step)
			ticks.push({ year, left: unit(year) });
		if (cluster.to % step !== 0) ticks.push({ year: cluster.to, left: unit(cluster.to) });
		for (const year of cluster.years) lefts.set(year, unit(year));
		offset += cluster.to - cluster.from;
		if (index < parts.length - 1) {
			breaks.push((100 * (offset + BREAK_WIDTH / 2)) / total);
			offset += BREAK_WIDTH;
		}
	}
	return {
		ticks,
		breaks,
		placed: [...dated]
			.sort((a, b) => a.year - b.year)
			.map((detail) => ({ detail, left: lefts.get(detail.year) ?? 0 }))
	};
}
