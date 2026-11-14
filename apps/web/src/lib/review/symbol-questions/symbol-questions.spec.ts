import { describe, expect, it } from 'vitest';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
import type { SymbolQuestionPin } from '#lib/symbols/types/symbol-question-pin.ts';
import { drawnSymbolQuestions, possibleQuestions, symbolItems } from './symbol-questions.ts';

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
		symbolName: 'Keys',
		fragment: { pinId: id, artworkId: 'a', x: 0, y: 0, viewWidth: 0.1, text: '' },
		...extra
	};
}

const first = (): number => 0;

describe('symbol questions', () => {
	it('asks for the symbol with three other names', () => {
		const [question] = drawnSymbolQuestions([pin('p1')], symbols, persons, 1, first);

		expect(question.kind).toBe('symbol');
		expect(question.right).toBe('Keys');
		expect(question.wrong).toHaveLength(3);
		expect(question.wrong).not.toContain('Keys');
	});

	it('offers the meaning and the attribute only when the pin has them', () => {
		const withMeaning = pin('p1', {
			meaning: { id: 'meaning-2', text: 'Meaning of Keys', persons: ['Peter'] }
		});
		const kinds = new Set<string>();
		for (let seed = 0; seed < 30; seed += 1) {
			let step = seed;
			const random = (): number => {
				step = (step * 7 + 3) % 11;
				return step / 11;
			};
			for (const question of drawnSymbolQuestions([withMeaning], symbols, persons, 1, random)) {
				kinds.add(question.kind);
			}
		}

		expect([...kinds].sort()).toEqual(['attribute', 'meaning', 'symbol']);
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

		expect(drawnSymbolQuestions([pin('p1')], few, persons, 1, first)).toEqual([]);
	});

	it('draws nothing for a count of zero and one question per pin', () => {
		expect(drawnSymbolQuestions([pin('p1')], symbols, persons, 0)).toEqual([]);
		expect(drawnSymbolQuestions([pin('p1')], symbols, persons, 3)).toHaveLength(1);
	});

	it('builds items whose right answer is among the shuffled options', () => {
		const questions = drawnSymbolQuestions([pin('p1')], symbols, persons, 1, first);
		const [item] = symbolItems(questions, new Map(), first);

		expect(item.mode).toBe('quiz_symbol');
		expect(item.quiz.options[item.quiz.answer].label).toBe('Keys');
		expect(item.key).toBe('p1:symbol');
	});
});
