import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';
import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';

const SORT_KEY = 'study-atelier:glossary-sort';

export const GLOSSARY_SORTS = ['name', 'recent'] as const;

export type GlossarySort = (typeof GLOSSARY_SORTS)[number];

export function rememberedGlossarySort(): GlossarySort {
	const stored = readStored('local', SORT_KEY);
	return GLOSSARY_SORTS.find((sort) => sort === stored) ?? 'name';
}

export function rememberGlossarySort(sort: GlossarySort): void {
	writeStored('local', SORT_KEY, sort);
}

export function newestFirst(entries: readonly GlossaryEntry[]): GlossaryEntry[] {
	return [...entries].sort(
		(a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.name.localeCompare(b.name)
	);
}
