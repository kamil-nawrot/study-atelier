import type { CardIndexRecord } from './card-index-record.ts';
import type { EraCode } from './era-code.ts';

export type CardIndexData = {
	values: CardIndexRecord[];
	periodEras: { periodId: string; eraCode: EraCode; count: number }[];
	stylePeriods: { styleId: string; periodId: string; count: number }[];
};
