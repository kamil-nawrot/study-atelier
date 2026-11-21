import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { isFigure } from '#lib/glossary/categories/categories.ts';
import { shuffle, shuffleQuiz } from '#lib/review/quiz/quiz.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import type { RoundTerm } from '#lib/review/types/round-term.ts';
import type { DefinedTerm } from '#lib/review/types/defined-term.ts';
import type { DefinitionItem } from '#lib/review/types/definition-item.ts';

function nameKey(term: GlossaryTerm): string {
	return term.name.trim().toLocaleLowerCase('pl');
}

export function definitionCount(
	preferences: Pick<Preferences, 'reviewGlossaryOn' | 'reviewGlossaryQuestions'>
): number {
	return preferences.reviewGlossaryOn ? preferences.reviewGlossaryQuestions : 0;
}

function closeness(entry: GlossaryTerm, term: GlossaryTerm): number {
	if (entry.category === term.category) return 2;
	return isFigure(entry.category) === isFigure(term.category) ? 1 : 0;
}

export function wrongNames(
	term: GlossaryTerm,
	glossary: readonly GlossaryTerm[],
	random: () => number
): string[] {
	const others = shuffle(
		glossary.filter((entry) => nameKey(entry) !== nameKey(term)),
		random
	).sort((a, b) => closeness(b, term) - closeness(a, term));
	const names = new Map(others.map((entry) => [nameKey(entry), entry.name]));
	return [...names.values()].slice(0, 3);
}

export function roundTerms(
	picked: readonly RoundTerm[],
	glossary: readonly GlossaryTerm[]
): GlossaryTerm[] {
	const byId = new Map(glossary.map((term) => [term.id, term]));
	return picked.flatMap(({ id }) => byId.get(id) ?? []);
}

export function definitionItems(
	drawn: readonly DefinedTerm[],
	glossary: readonly GlossaryTerm[],
	random: () => number = Math.random,
	cards: ReadonlyMap<string, ExtraCard> = new Map()
): DefinitionItem[] {
	return drawn.map((term) => {
		const options = [term.name, ...wrongNames(term, glossary, random)].map((label) => ({
			label
		}));
		return {
			mode: 'quiz_definition' as const,
			term,
			card: cards.get(term.id) ?? null,
			quiz: shuffleQuiz({ options, answer: 0 }, random)
		};
	});
}

export function withDefinitionsOf(
	drawn: readonly GlossaryTerm[],
	definitions: ReadonlyMap<string, string>
): DefinedTerm[] {
	return drawn.flatMap((term) => {
		const definition = definitions.get(term.id);
		return definition ? [{ ...term, definition }] : [];
	});
}
