import type { SummaryGroup } from '#lib/review/types/summary-group.ts';

export type SessionSummary = {
	count: number;
	minutes: number;
	tomorrow: number;
	groups: SummaryGroup[];
	free: boolean;
	years: { asked: number; hit: number };
	orders: { asked: number; right: number };
	definitions: { asked: number; right: number };
	symbols: { asked: number; right: number };
	notes: { asked: number; right: number };
};
