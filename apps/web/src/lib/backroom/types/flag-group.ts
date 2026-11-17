import type { FlagItem } from './flag-item.ts';
import type { FlagReason } from './flag-reason.ts';

export type FlagGroup = {
	item: FlagItem;
	reasons: FlagReason[];
};
