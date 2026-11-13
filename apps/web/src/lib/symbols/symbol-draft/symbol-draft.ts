import { contextKey } from '#lib/symbols/symbol-contexts/symbol-contexts.ts';
import type { MeaningDraft } from '#lib/symbols/types/meaning-draft.ts';
import type { SymbolDraft } from '#lib/symbols/types/symbol-draft.ts';
import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';

export const SYMBOL_NAME_MAX_LENGTH = 120;
export const MEANING_TEXT_MAX_LENGTH = 200;
export const MAX_MEANINGS = 10;
export const MAX_CONTEXTS = 10;

let drafted = 0;

export function newMeaning(): MeaningDraft {
	drafted += 1;
	return { key: `meaning-${drafted}`, text: '', contexts: [] };
}

export function emptySymbolDraft(): SymbolDraft {
	return { name: '', meanings: [newMeaning()] };
}

export function symbolDraftOf(entry: SymbolEntry): SymbolDraft {
	return {
		name: entry.name,
		meanings:
			entry.meanings.length > 0
				? entry.meanings.map((meaning) => ({
						key: meaning.id,
						id: meaning.id,
						text: meaning.text,
						contexts: [...meaning.contexts]
					}))
				: [newMeaning()]
	};
}

function sameMeaning(a: MeaningDraft, b: MeaningDraft): boolean {
	return (
		a.id === b.id &&
		a.text.trim() === b.text.trim() &&
		a.contexts.map(contextKey).join('|') === b.contexts.map(contextKey).join('|')
	);
}

function filled(meanings: readonly MeaningDraft[]): MeaningDraft[] {
	return meanings.filter((meaning) => meaning.text.trim() !== '' || meaning.contexts.length > 0);
}

export function symbolDraftChanged(current: SymbolDraft, saved: SymbolDraft): boolean {
	const now = filled(current.meanings);
	const before = filled(saved.meanings);
	return (
		current.name.trim() !== saved.name.trim() ||
		now.length !== before.length ||
		now.some((meaning, index) => !sameMeaning(meaning, before[index]))
	);
}

export function meaningsToSave(meanings: readonly MeaningDraft[]): MeaningDraft[] {
	return filled(meanings);
}
