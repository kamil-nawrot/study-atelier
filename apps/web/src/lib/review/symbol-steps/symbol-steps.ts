import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import {
	drawnSymbolQuestions,
	symbolItems
} from '#lib/review/symbol-questions/symbol-questions.ts';
import type { SymbolItem } from '#lib/review/types/symbol-item.ts';
import { loadSymbolQuestionPins } from '#lib/symbols/symbol-questions-data/symbol-questions-data.ts';
import { loadSymbolOptions } from '#lib/symbols/symbols-data/symbols-data.ts';

export async function loadSymbolSteps(
	count: number,
	glossary: readonly GlossaryTerm[]
): Promise<SymbolItem[]> {
	if (count <= 0) return [];
	const [pins, options] = await Promise.all([loadSymbolQuestionPins(), loadSymbolOptions()]);
	if (pins.error || options.error) return [];
	const questions = drawnSymbolQuestions(pins.pins, options.symbols, glossary, count);
	const lenses = await fragmentLenses(questions.map((question) => question.pin.fragment));
	return symbolItems(questions, lenses);
}
