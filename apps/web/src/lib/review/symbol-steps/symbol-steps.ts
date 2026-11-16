import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import {
	pickedSymbolQuestions,
	symbolItems
} from '#lib/review/symbol-questions/symbol-questions.ts';
import { NO_EXTRA_CARDS } from '#lib/review/extra-cards/extra-cards.ts';
import type { ExtraCards } from '#lib/review/types/extra-cards.ts';
import type { SymbolItem } from '#lib/review/types/symbol-item.ts';
import {
	loadSymbolQuestionImages,
	loadSymbolQuestionPins
} from '#lib/symbols/symbol-questions-data/symbol-questions-data.ts';
import { loadSymbolOptions } from '#lib/symbols/symbols-data/symbols-data.ts';

export async function loadSymbolSteps(
	count: number,
	glossary: readonly GlossaryTerm[],
	cards: ExtraCards = NO_EXTRA_CARDS,
	now: Date = new Date(),
	held: ReadonlySet<string> = new Set()
): Promise<SymbolItem[]> {
	if (count <= 0) return [];
	const [pins, options] = await Promise.all([loadSymbolQuestionPins(), loadSymbolOptions()]);
	if (pins.error || options.error) return [];
	const questions = pickedSymbolQuestions(
		pins.pins.filter((pin) => !held.has(pin.symbolId)),
		options.symbols,
		glossary,
		count,
		cards,
		now
	);
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
