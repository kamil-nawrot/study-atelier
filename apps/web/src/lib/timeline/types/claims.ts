import type { TimeStatement } from './time-statement.ts';

export type Claims = Partial<Record<string, TimeStatement[]>>;
