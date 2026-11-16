import { describe, expect, it } from 'vitest';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
import type { SymbolQuestionPin } from '#lib/symbols/types/symbol-question-pin.ts';
import { NO_EXTRA_CARDS } from '#lib/review/extra-cards/extra-cards.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import { pickedSymbolQuestions, possibleQuestions, symbolItems } from './symbol-questions.ts';

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
const now = new Date('2026-11-16T12:00:00');

function picked(
	pins: SymbolQuestionPin[],
	count: number,
	cards = NO_EXTRA_CARDS,
	options: SymbolOption[] = symbols
): ReturnType<typeof pickedSymbolQuestions> {
	return pickedSymbolQuestions(pins, options, persons, count, cards, now, first);
}

function card(symbolId: string, due: string): ExtraCard {
	return {
		id: `card-${symbolId}`,
		termId: null,
		symbolId,
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
		const [question] = picked([pin('p1')], 1);

		expect(question.kind).toBe('symbol');
		expect(question.right).toBe('Keys');
		expect(question.wrong).toHaveLength(3);
		expect(question.wrong).not.toContain('Keys');
		expect(question.card).toBeNull();
	});

	it('asks the kind of question asked least recently for the symbol', () => {
		const withMeaning = pin('p1', {
			meaning: { id: 'meaning-2', text: 'Meaning of Keys', persons: ['Peter'] }
		});
		const asked = (kinds: Record<string, number>): typeof NO_EXTRA_CARDS => ({
			...NO_EXTRA_CARDS,
			askedKinds: new Map([['symbol-keys', kinds]])
		});

		expect(picked([withMeaning], 1)[0].kind).toBe('symbol');
		expect(picked([withMeaning], 1, asked({ symbol: 10 }))[0].kind).toBe('meaning');
		expect(picked([withMeaning], 1, asked({ symbol: 10, meaning: 20 }))[0].kind).toBe('attribute');
		expect(picked([pin('p2')], 1, asked({ symbol: 10, meaning: 5 }))[0].kind).toBe('symbol');
	});

	it('asks a due symbol first with its card and a new one in the place left', () => {
		const lily = pin('p2', { symbolId: 'symbol-lily', symbolName: 'Lily' });
		const dove = pin('p3', { symbolId: 'symbol-dove', symbolName: 'Dove' });
		const cards = {
			...NO_EXTRA_CARDS,
			symbols: new Map([
				['symbol-lily', card('symbol-lily', '2026-11-14T08:00:00')],
				['symbol-dove', card('symbol-dove', '2026-12-01T08:00:00')]
			])
		};

		const questions = picked([pin('p1'), lily, dove], 2, cards);

		expect(questions.map((question) => question.pin.symbolName)).toEqual(['Lily', 'Keys']);
		expect(questions[0].card?.id).toBe('card-symbol-lily');
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

		expect(picked([pin('p1')], 1, NO_EXTRA_CARDS, few)).toEqual([]);
	});

	it('draws nothing for a count of zero and one question per symbol', () => {
		expect(picked([pin('p1')], 0)).toEqual([]);
		expect(picked([pin('p1'), pin('p2')], 3)).toHaveLength(1);
	});

	it('builds items whose right answer is among the shuffled options', () => {
		const questions = picked([pin('p1')], 1);
		const [item] = symbolItems(questions, new Map(), first);

		expect(item.mode).toBe('quiz_symbol');
		expect(item.quiz.options[item.quiz.answer].label).toBe('Keys');
		expect(item.key).toBe('p1:symbol');
	});
});
