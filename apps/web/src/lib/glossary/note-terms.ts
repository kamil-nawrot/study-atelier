import type { NoteTerm } from '@study-atelier/ui';
import type { GlossaryEntry } from './types.ts';

export function noteTermsOf(entries: GlossaryEntry[]): NoteTerm[] {
	return entries.map((entry) => ({
		id: entry.id,
		phrases: [entry.name, ...entry.synonyms, ...entry.forms]
	}));
}
