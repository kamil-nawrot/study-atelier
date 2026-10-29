import type { Exhibit } from '#lib/career/types/exhibit.ts';
import type { ExhibitProgress } from '#lib/career/types/exhibit-progress.ts';
import type { Metal } from '#lib/career/types/metal.ts';
import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';

const METALS: readonly Metal[] = ['iron', 'bronze', 'silver', 'gold', 'glow'];
const HIDDEN = new Set(['night_watch', 'marathon']);

export const SETTING_STEPS = 5;

export function withTiers(progress: ExhibitProgress[], tiers: UnlockedTier[]): Exhibit[] {
	return progress.map(({ exhibit, value, thresholds }) => ({
		code: exhibit,
		value,
		thresholds,
		tiers: tiers.filter((tier) => tier.exhibit === exhibit)
	}));
}

export function reachedTier(exhibit: Exhibit): number {
	const stored = Math.max(0, ...exhibit.tiers.map((tier) => tier.tier));
	const counted = exhibit.thresholds.filter((threshold) => exhibit.value >= threshold).length;
	return Math.max(stored, counted);
}

export function nextThreshold(exhibit: Exhibit): number | undefined {
	return exhibit.thresholds[reachedTier(exhibit)];
}

export function metalOf(tier: number, total: number): Metal {
	if (tier <= 0) return 'none';
	if (tier >= total) return 'glow';
	return METALS[Math.floor(((tier - 1) * (METALS.length - 1)) / (total - 1))];
}

export function settingOf(tier: number): number {
	return Math.min(tier, SETTING_STEPS);
}

export function isHidden(exhibit: Exhibit): boolean {
	return HIDDEN.has(exhibit.code) && reachedTier(exhibit) === 0;
}

export function hasNewTier(exhibit: Exhibit): boolean {
	return exhibit.tiers.some((tier) => tier.seenAt === undefined);
}
