import type { TimeSpan } from './time-span.ts';

export type Segment = TimeSpan & {
	number: number;
	beforeCommonEra: boolean;
};
