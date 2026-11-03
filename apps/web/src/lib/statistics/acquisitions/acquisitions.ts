import type { GrowthUnit } from '#lib/statistics/types/growth-unit.ts';

const LABEL_EVERY: Record<GrowthUnit, number> = { day: 5, week: 4, month: 2 };

export type Column = { start: string; added: number; label?: string };

export function columnsOf(
	unit: GrowthUnit,
	buckets: readonly { start: string; added: number }[]
): Column[] {
	return buckets.map((bucket, index) => ({
		...bucket,
		label: index % LABEL_EVERY[unit] === 0 ? shortDate(unit, bucket.start) : undefined
	}));
}

export function shortDate(unit: GrowthUnit, start: string): string {
	const [year, month, day] = start.split('-').map(Number);
	if (unit === 'month') return `${String(month).padStart(2, '0')}.${year}`;
	return `${day}.${String(month).padStart(2, '0')}`;
}

export function ticksOf(max: number): number[] {
	const step = Math.max(1, Math.ceil(max / 4));
	return [0, step, step * 2, step * 3, step * 4];
}
