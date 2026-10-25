import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { CardIndexEntry } from './card-index-entry.ts';
import type { CardIndexPeriod } from './card-index-period.ts';

type CardIndexEra = {
	code: EraCode;
	periods: CardIndexPeriod[];
};

export type CardIndexTimeline = {
	eras: CardIndexEra[];
	periodsWithoutEra: CardIndexPeriod[];
	stylesWithoutPeriod: CardIndexEntry[];
};
