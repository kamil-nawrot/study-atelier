import type { CardIndexEntry } from './card-index-entry.ts';

export type CardIndexPeriod = CardIndexEntry & {
	styles: CardIndexEntry[];
};
