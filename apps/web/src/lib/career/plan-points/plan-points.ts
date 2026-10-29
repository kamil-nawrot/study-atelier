const PLAN_POINTS = 10;
const STREAK_STEP = 0.05;
const STREAK_STEPS = 10;

export function streakBonus(streak: number): number {
	return Math.min(Math.max(streak - 1, 0), STREAK_STEPS) * STREAK_STEP;
}

export function planPoints(share: number, streak: number): number {
	return Math.round(PLAN_POINTS * share * (1 + streakBonus(streak)));
}
