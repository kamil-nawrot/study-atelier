import { describe, expect, it } from 'vitest';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
import type { SymbolQuestionPin } from '#lib/symbols/types/symbol-question-pin.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import type { RoundSymbol } from '#lib/review/types/round-symbol.ts';
import type { SymbolQuestionKind } from '#lib/review/types/symbol-question-kind.ts';
import { possibleQuestions, roundSymbolQuestions, symbolItems } from './symbol-questions.ts';

const symbols: SymbolOption[] = ['Lily', 'Skull', 'Keys', 'Dove', 'Globe'].map((name, index) => ({
	id: `symbol-${index}`,
	name,
	meanings: [{ id: `meaning-${index}`, text: `Meaning of ${name}` }]
}));

const persons = ['Peter', 'Paul', 'Mary', 'John'].map(
	(name) => ({ id: name, name, category: 'person' }) as unknown as GlossaryTerm
);

function pin(id: string, extra: Partial<SymbolQuestionPin> = {}): SymbolQuestionPin {
	return {
		pinId: id,
		symbolId: 'symbol-keys',
		symbolName: 'Keys',
		fragment: { pinId: id, artworkId: 'a', x: 0, y: 0, viewWidth: 0.1, text: '' },
		...extra
	};
}

const first = (): number => 0;
function round(
	pinId: string,
	kind: SymbolQuestionKind = 'symbol',
	card: ExtraCard | null = null
): RoundSymbol {
	return { symbolId: 'symbol-keys', pinId, kind, card };
}

function picked(
	pins: SymbolQuestionPin[],
	symbolsOfRound: RoundSymbol[],
	options: SymbolOption[] = symbols
): ReturnType<typeof roundSymbolQuestions> {
	return roundSymbolQuestions(symbolsOfRound, pins, options, persons, first);
}

function card(symbolId: string, due: string): ExtraCard {
	return {
		id: `card-${symbolId}`,
		termId: null,
		symbolId,
		eventId: null,
		due: new Date(due),
		stability: 2,
		difficulty: 5,
		state: 2,
		reps: 1,
		lapses: 0,
		scheduledDays: 2,
		learningSteps: 0,
		lastReview: null,
		lastRating: 2
	};
}

describe('symbol questions', () => {
	it('asks for the symbol with three other names', () => {
		const [question] = picked([pin('p1')], [round('p1')]);

		expect(question.kind).toBe('symbol');
		expect(question.right).toBe('Keys');
		expect(question.wrong).toHaveLength(3);
		expect(question.wrong).not.toContain('Keys');
		expect(question.card).toBeNull();
	});

	it('asks the kind the round picked on its pin, with the card of the symbol', () => {
		const withMeaning = pin('p1', {
			meaning: { id: 'meaning-2', text: 'Meaning of Keys', persons: ['Peter'] }
		});
		const due = card('symbol-keys', '2026-11-14T08:00:00');

		const [meaning] = picked([withMeaning], [round('p1', 'meaning', due)]);
		const [attribute] = picked([withMeaning], [round('p1', 'attribute')]);

		expect(meaning).toMatchObject({ kind: 'meaning', right: 'Meaning of Keys' });
		expect(meaning.card?.id).toBe('card-symbol-keys');
		expect(attribute).toMatchObject({ kind: 'attribute', right: 'Peter' });
	});

	it('keeps the order of the round and leaves out a pin not loaded or a kind it cannot build', () => {
		const lily = pin('p2', { symbolId: 'symbol-lily', symbolName: 'Lily' });

		const questions = picked(
			[pin('p1'), lily],
			[
				{ ...round('p2'), symbolId: 'symbol-lily' },
				round('gone'),
				round('p1', 'meaning'),
				round('p1')
			]
		);

		expect(questions.map((question) => question.pin.symbolName)).toEqual(['Lily', 'Keys']);
	});

	it('never offers another person of the same meaning as a wrong attribute', () => {
		const pool = {
			names: [],
			meanings: [],
			persons: ['Peter', 'Paul', 'Mary', 'John', 'Andrew']
		};
		const withTwo = pin('p1', {
			meaning: { id: 'meaning-2', text: 'Meaning of Keys', persons: ['Peter', 'Paul'] }
		});

		const attribute = possibleQuestions(withTwo, pool, first).find(
			(question) => question.kind === 'attribute'
		);

		expect(attribute?.right).toBe('Peter');
		expect(attribute?.wrong.sort()).toEqual(['Andrew', 'John', 'Mary']);
		expect(
			possibleQuestions(withTwo, { ...pool, persons: pool.persons.slice(0, 4) }, first).some(
				(question) => question.kind === 'attribute'
			)
		).toBe(false);
	});

	it('skips a question without four sensible answers', () => {
		const few = symbols.slice(0, 3);

		expect(picked([pin('p1')], [round('p1')], few)).toEqual([]);
	});

	it('builds items whose right answer is among the shuffled options', () => {
		const questions = picked([pin('p1')], [round('p1')]);
		const [item] = symbolItems(questions, new Map(), first);

		expect(item.mode).toBe('quiz_symbol');
		expect(item.quiz.options[item.quiz.answer].label).toBe('Keys');
		expect(item.key).toBe('p1:symbol');
	});
});
