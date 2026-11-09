import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';

export type Exhibit = {
	code: string;
	room: string;
	hidden: boolean;
	value: number;
	thresholds: number[];
	tiers: UnlockedTier[];
};
