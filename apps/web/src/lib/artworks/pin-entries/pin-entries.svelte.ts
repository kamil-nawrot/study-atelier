import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { addSymbolMeaning } from '#lib/symbols/symbols-data/symbols-data.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';

type Pending<T> = ((value: T | undefined) => void) | undefined;

function merged<T extends { id: string }>(base: readonly T[], local: readonly T[]): T[] {
	return [...base.filter((item) => !local.some((own) => own.id === item.id)), ...local];
}

export class PinEntries {
	termOpen = $state(false);
	termName = $state('');
	symbolOpen = $state(false);
	symbolName = $state('');

	#terms = $state.raw<GlossaryTerm[]>([]);
	#symbols = $state.raw<SymbolOption[]>([]);
	#pendingTerm: Pending<GlossaryTerm>;
	#pendingSymbol: Pending<SymbolOption>;
	readonly #baseTerms: () => readonly GlossaryTerm[];
	readonly #baseSymbols: () => readonly SymbolOption[];

	constructor(terms: () => readonly GlossaryTerm[], symbols: () => readonly SymbolOption[]) {
		this.#baseTerms = terms;
		this.#baseSymbols = symbols;
	}

	terms = $derived.by(() => merged(this.#baseTerms(), this.#terms));
	symbols = $derived.by(() => merged(this.#baseSymbols(), this.#symbols));

	newTerm = (name: string): Promise<GlossaryTerm | undefined> => {
		this.#pendingTerm?.(undefined);
		this.termName = name;
		this.termOpen = true;
		return new Promise((resolve) => (this.#pendingTerm = resolve));
	};

	newSymbol = (name: string): Promise<SymbolOption | undefined> => {
		this.#pendingSymbol?.(undefined);
		this.symbolName = name;
		this.symbolOpen = true;
		return new Promise((resolve) => (this.#pendingSymbol = resolve));
	};

	termAdded = (term: GlossaryTerm): void => {
		this.#terms = [...this.#terms, term];
		this.#pendingTerm?.(term);
		this.#pendingTerm = undefined;
	};

	symbolAdded = (symbol: SymbolOption): void => {
		this.#symbols = [...this.#symbols, symbol];
		this.#pendingSymbol?.(symbol);
		this.#pendingSymbol = undefined;
	};

	addMeaning = async (
		symbolId: string,
		position: number,
		text: string
	): Promise<{ id?: string; error?: string }> => {
		const result = await addSymbolMeaning(symbolId, position, text);
		const symbol = this.symbols.find((item) => item.id === symbolId);
		if (result.id && symbol) {
			const updated = { ...symbol, meanings: [...symbol.meanings, { id: result.id, text }] };
			this.#symbols = [...this.#symbols.filter((item) => item.id !== symbolId), updated];
		}
		return result;
	};
}
