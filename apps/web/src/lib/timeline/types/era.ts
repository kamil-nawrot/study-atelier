import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { TimeSpan } from './time-span.ts';

export type Era = TimeSpan & {
	code: EraCode;
};
