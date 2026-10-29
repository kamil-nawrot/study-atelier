import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';

export type Exhibit = {
	code: string;
	value: number;
	thresholds: number[];
	tiers: UnlockedTier[];
};
