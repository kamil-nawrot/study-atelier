import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { SymbolContext } from '#lib/symbols/types/symbol-context.ts';

export function contextCandidates(
	index: CardIndexData,
	terms: readonly GlossaryTerm[]
): SymbolContext[] {
	return [
		...ERA_CODES.map((eraCode) => ({
			kind: 'era' as const,
			eraCode,
			name: m.eras[eraCode].name
		})),
		...index.values.map((value) => ({
			kind: 'value' as const,
			valueId: value.id,
			category: value.category,
			name: value.name
		})),
		...terms
			.filter((term) => term.category === 'person')
			.map((term) => ({ kind: 'person' as const, entryId: term.id, name: term.name }))
	];
}
