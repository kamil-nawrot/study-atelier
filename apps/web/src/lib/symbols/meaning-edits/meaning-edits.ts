import { MAX_MEANINGS, newMeaning } from '#lib/symbols/symbol-draft/symbol-draft.ts';
import type { MeaningDraft } from '#lib/symbols/types/meaning-draft.ts';
import type { SymbolDraft } from '#lib/symbols/types/symbol-draft.ts';
import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';

function draftsOf(symbol: SymbolEntry): MeaningDraft[] {
	return symbol.meanings.map((meaning) => ({
		key: meaning.id,
		id: meaning.id,
		text: meaning.text,
		contexts: [...meaning.contexts]
	}));
}

export function canAddMeaning(symbol: SymbolEntry): boolean {
	return symbol.meanings.length < MAX_MEANINGS;
}

export function withMeaning(
	symbol: SymbolEntry,
	meaning: Pick<MeaningDraft, 'text' | 'contexts'>,
	id?: string
): SymbolDraft {
	const meanings = draftsOf(symbol);
	const edited = meanings.find((own) => own.id === id);
	if (edited) {
		edited.text = meaning.text;
		edited.contexts = [...meaning.contexts];
	} else {
		meanings.push({ ...newMeaning(), text: meaning.text, contexts: [...meaning.contexts] });
	}
	return { name: symbol.name, description: symbol.description ?? '', meanings };
}

export function withoutMeaning(symbol: SymbolEntry, id: string): SymbolDraft {
	return {
		name: symbol.name,
		description: symbol.description ?? '',
		meanings: draftsOf(symbol).filter((meaning) => meaning.id !== id)
	};
}

export function withMovedMeaning(symbol: SymbolEntry, id: string, step: -1 | 1): SymbolDraft {
	const meanings = draftsOf(symbol);
	const index = meanings.findIndex((meaning) => meaning.id === id);
	const target = index + step;
	if (index >= 0 && target >= 0 && target < meanings.length) {
		[meanings[index], meanings[target]] = [meanings[target], meanings[index]];
	}
	return { name: symbol.name, description: symbol.description ?? '', meanings };
}
