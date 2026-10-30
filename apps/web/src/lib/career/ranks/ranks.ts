import { m } from '#lib/i18n/i18n.ts';
import type { RankForm } from '#lib/profile/types/rank-form.ts';
import type { Rank } from '#lib/career/types/rank.ts';

export const RANK_THRESHOLDS = [
	0, 50, 200, 500, 1000, 2000, 4000, 7500, 13000, 22000, 40000, 70000
] as const;

export function rankOf(points: number): Rank {
	const level = RANK_THRESHOLDS.findLastIndex((floor) => points >= floor);
	return {
		level: level + 1,
		floor: RANK_THRESHOLDS[level],
		next: RANK_THRESHOLDS[level + 1]
	};
}

export function progressToNext(points: number): number {
	const { floor, next } = rankOf(points);
	return next === undefined ? 1 : (points - floor) / (next - floor);
}

export function rankName(level: number, form: RankForm): string {
	const names = m.career.ranks[form];
	return names[Math.min(Math.max(level, 1), names.length) - 1];
}
