import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { dueFirst, leastAskedKind } from '#lib/review/extra-cards/extra-cards.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import type { ExtraCards } from '#lib/review/types/extra-cards.ts';
import { shuffle, shuffleQuiz } from '#lib/review/quiz/quiz.ts';
import type { SymbolItem } from '#lib/review/types/symbol-item.ts';
import type { SymbolQuestionKind } from '#lib/review/types/symbol-question-kind.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
import type { SymbolQuestionPin } from '#lib/symbols/types/symbol-question-pin.ts';

export const SYMBOL_ANSWERS = 4;

type Pool = {
	names: string[];
	meanings: string[];
	persons: string[];
};

export type SymbolQuestion = {
	pin: SymbolQuestionPin;
	kind: SymbolQuestionKind;
	right: string;
	wrong: string[];
	card?: ExtraCard | null;
};

function key(text: string): string {
	return text.trim().toLocaleLowerCase('pl');
}

function others(values: readonly string[], right: string, random: () => number): string[] {
	const unique = new Map<string, string>();
	for (const value of shuffle([...values], random)) {
		if (key(value) !== key(right) && !unique.has(key(value))) unique.set(key(value), value);
	}
	return [...unique.values()].slice(0, SYMBOL_ANSWERS - 1);
}

function poolOf(symbols: readonly SymbolOption[], glossary: readonly GlossaryTerm[]): Pool {
	return {
		names: symbols.map((symbol) => symbol.name),
		meanings: symbols.flatMap((symbol) => symbol.meanings.map((meaning) => meaning.text)),
		persons: glossary.filter((term) => term.category === 'person').map((term) => term.name)
	};
}

export function possibleQuestions(
	pin: SymbolQuestionPin,
	pool: Pool,
	random: () => number
): SymbolQuestion[] {
	const candidates: { kind: SymbolQuestionKind; right: string; from: string[] }[] = [
		{ kind: 'symbol', right: pin.symbolName, from: pool.names }
	];
	if (pin.meaning) {
		candidates.push({ kind: 'meaning', right: pin.meaning.text, from: pool.meanings });
		const [person] = pin.meaning.persons;
		if (person) {
			const own = new Set(pin.meaning.persons.map(key));
			const from = pool.persons.filter((name) => !own.has(key(name)));
			candidates.push({ kind: 'attribute', right: person, from });
		}
	}
	return candidates.flatMap(({ kind, right, from }) => {
		const wrong = others(from, right, random);
		return wrong.length === SYMBOL_ANSWERS - 1 ? [{ pin, kind, right, wrong }] : [];
	});
}

export function pickedSymbolQuestions(
	pins: readonly SymbolQuestionPin[],
	symbols: readonly SymbolOption[],
	glossary: readonly GlossaryTerm[],
	count: number,
	cards: Pick<ExtraCards, 'symbols' | 'askedKinds'>,
	now: Date,
	random: () => number = Math.random
): SymbolQuestion[] {
	if (count <= 0) return [];
	const pool = poolOf(symbols, glossary);
	const bySymbol = new Map<string, SymbolQuestion[]>();
	for (const pin of pins) {
		const questions = possibleQuestions(pin, pool, random);
		if (questions.length > 0)
			bySymbol.set(pin.symbolId, [...(bySymbol.get(pin.symbolId) ?? []), ...questions]);
	}
	const picked = dueFirst([...bySymbol.keys()], (id) => cards.symbols.get(id), count, now, random);
	return picked.flatMap(({ item: symbolId, card }) => {
		const questions = bySymbol.get(symbolId) ?? [];
		const kind = leastAskedKind(
			[...new Set(questions.map((question) => question.kind))],
			cards.askedKinds.get(symbolId)
		);
		const ofKind = shuffle(
			questions.filter((question) => question.kind === kind),
			random
		);
		return ofKind[0] ? [{ ...ofKind[0], card }] : [];
	});
}

export function symbolItems(
	questions: readonly SymbolQuestion[],
	lenses: ReadonlyMap<string, NonNullable<SymbolItem['lens']>>,
	random: () => number = Math.random
): SymbolItem[] {
	return questions.map(({ pin, kind, right, wrong, card }) => {
		const lens = lenses.get(pin.pinId);
		return {
			mode: 'quiz_symbol' as const,
			kind,
			symbol: { id: pin.symbolId, name: pin.symbolName },
			card: card ?? null,
			key: `${pin.pinId}:${kind}`,
			...(lens ? { lens } : {}),
			quiz: shuffleQuiz(
				{ options: [right, ...wrong].map((label) => ({ label })), answer: 0 },
				random
			)
		};
	});
}
