import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import { m } from '#lib/i18n/i18n.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';

export const CONTEXT_TEXT_MAX_LENGTH = 80;

const CATEGORIES: readonly CategoryCode[] = ['author', 'period', 'style', 'material', 'location'];

export type ContextRow = {
	position: number;
	value_id: string | null;
	era_code: string | null;
	artwork_id: string | null;
	glossary_entry_id: string | null;
	text: string | null;
	category_values: { category_code: string; name: string } | null;
	artworks: { record_number: number; title: string } | null;
	glossary_entries: { name: string } | null;
};

export type ContextWrite =
	| { value_id: string }
	| { era_code: string }
	| { artwork_id: string }
	| { glossary_entry_id: string }
	| { text: string };

function isCategory(code: string): code is CategoryCode {
	return (CATEGORIES as readonly string[]).includes(code);
}

export function contextOf(row: ContextRow): SymbolContext {
	const value = row.category_values;
	if (row.value_id && value && isCategory(value.category_code)) {
		return {
			kind: 'value',
			valueId: row.value_id,
			category: value.category_code,
			name: value.name
		};
	}
	if (row.era_code && isEraCode(row.era_code)) {
		return { kind: 'era', eraCode: row.era_code, name: m.eras[row.era_code].name };
	}
	if (row.artwork_id && row.artworks) {
		return {
			kind: 'artwork',
			artworkId: row.artwork_id,
			number: row.artworks.record_number,
			name: row.artworks.title
		};
	}
	if (row.glossary_entry_id && row.glossary_entries) {
		return { kind: 'person', entryId: row.glossary_entry_id, name: row.glossary_entries.name };
	}
	return { kind: 'text', name: row.text ?? value?.name ?? '' };
}

export function contextWrite(context: SymbolContext): ContextWrite {
	switch (context.kind) {
		case 'value':
			return { value_id: context.valueId };
		case 'era':
			return { era_code: context.eraCode };
		case 'artwork':
			return { artwork_id: context.artworkId };
		case 'person':
			return { glossary_entry_id: context.entryId };
		case 'text':
			return { text: context.name.trim() };
	}
}

export function contextKindName(context: SymbolContext): string | undefined {
	switch (context.kind) {
		case 'value':
			return m.symbols.contextKinds[context.category];
		case 'era':
		case 'artwork':
		case 'person':
			return m.symbols.contextKinds[context.kind];
		case 'text':
			return undefined;
	}
}

export function contextKey(context: SymbolContext): string {
	switch (context.kind) {
		case 'value':
			return `value:${context.valueId}`;
		case 'era':
			return `era:${context.eraCode}`;
		case 'artwork':
			return `artwork:${context.artworkId}`;
		case 'person':
			return `person:${context.entryId}`;
		case 'text':
			return `text:${context.name.trim().toLocaleLowerCase('pl')}`;
	}
}

const SUGGESTION_LIMIT = 8;

export type ContextOption = { kind: 'existing' | 'new'; name: string };

export function contextLabel(context: SymbolContext): string {
	const kind = contextKindName(context);
	return kind ? `${context.name} · ${kind}` : context.name;
}

export function suggestContexts(
	candidates: readonly SymbolContext[],
	chosen: readonly SymbolContext[],
	query: string
): ContextOption[] {
	const term = normalizeForSearch(query);
	if (!term) return [];
	const taken = new Set(chosen.map(contextKey));
	const labels = new Set(chosen.map((context) => normalizeForSearch(contextLabel(context))));
	const seen = new Set<string>();
	const matches = candidates
		.filter((context) => {
			const key = contextKey(context);
			if (taken.has(key) || seen.has(key)) return false;
			seen.add(key);
			return normalizeForSearch(context.name).includes(term);
		})
		.sort(
			(a, b) =>
				Number(!normalizeForSearch(a.name).startsWith(term)) -
					Number(!normalizeForSearch(b.name).startsWith(term)) || a.name.localeCompare(b.name, 'pl')
		)
		.slice(0, SUGGESTION_LIMIT);
	const name = query.trim();
	const exact = matches.some((context) => normalizeForSearch(context.name) === term);
	const free =
		!exact && !labels.has(term) && name.length <= CONTEXT_TEXT_MAX_LENGTH
			? [{ kind: 'new' as const, name }]
			: [];
	return [
		...matches.map((context) => ({ kind: 'existing' as const, name: contextLabel(context) })),
		...free
	];
}

export function contextsOf(
	labels: readonly string[],
	known: readonly SymbolContext[]
): SymbolContext[] {
	const byLabel = new Map(known.map((context) => [contextLabel(context), context]));
	return labels.map((label) => byLabel.get(label) ?? { kind: 'text', name: label.trim() });
}
