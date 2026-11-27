import type { MergeField } from './merge-field.ts';

export type MergeChanges = {
	fields: MergeField[];
	added: string[];
	dropped: string[];
	images: string[];
	droppedImages: string[];
};
