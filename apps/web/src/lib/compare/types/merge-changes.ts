import type { MergeField } from './merge-field.ts';

export type MergeChanges = {
	fields: MergeField[];
	images: string[];
};
