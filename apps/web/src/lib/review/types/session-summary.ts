import type { SummaryGroup } from '#lib/review/types/summary-group.ts';

export type SessionSummary = {
	count: number;
	minutes: number;
	tomorrow: number;
	groups: SummaryGroup[];
	free: boolean;
	years: { asked: number; hit: number };
	orders: { asked: number; right: number };
};
