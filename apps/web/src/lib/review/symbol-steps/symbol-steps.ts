import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import {
	roundSymbolQuestions,
	symbolItems
} from '#lib/review/symbol-questions/symbol-questions.ts';
import type { RoundSymbol } from '#lib/review/types/round-symbol.ts';
import type { SymbolItem } from '#lib/review/types/symbol-item.ts';
import {
	loadSymbolQuestionImages,
	loadSymbolQuestionPins
} from '#lib/symbols/symbol-questions-data/symbol-questions-data.ts';
import { loadSymbolOptions } from '#lib/symbols/symbols-data/symbols-data.ts';

export async function loadSymbolSteps(
	picked: readonly RoundSymbol[],
	glossary: readonly GlossaryTerm[]
): Promise<SymbolItem[]> {
	if (picked.length === 0) return [];
	const [pins, options] = await Promise.all([
		loadSymbolQuestionPins(picked.map((symbol) => symbol.pinId)),
		loadSymbolOptions()
	]);
	if (pins.error || options.error) return [];
	const questions = roundSymbolQuestions(picked, pins.pins, options.symbols, glossary);
	const images = await loadSymbolQuestionImages(questions.map((question) => question.pin.pinId));
	if (!images) return [];
	const lenses = await fragmentLenses(
		questions.map((question) => ({
			...question.pin.fragment,
			image: images.get(question.pin.pinId) ?? null
		}))
	);
	return symbolItems(questions, lenses);
}
