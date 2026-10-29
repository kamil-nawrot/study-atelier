import type { Dated } from './dated.ts';

export type Mark<T extends Dated> = {
	item: T;
	start: number;
	end: number;
	cutBefore: boolean;
	cutAfter: boolean;
	at: number;
};
