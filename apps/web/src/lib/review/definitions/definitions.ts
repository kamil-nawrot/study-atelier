import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import { shuffle, shuffleQuiz } from '#lib/review/quiz/quiz.ts';
import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

export const MIN_DEFINITION_TERMS = 4;

function nameKey(entry: GlossaryEntry): string {
	return entry.name.trim().toLocaleLowerCase('pl');
}

function defined(glossary: readonly GlossaryEntry[]): GlossaryEntry[] {
	return glossary.filter((entry) => entry.definition.trim() !== '');
}

export function definitionsOffered(glossary: readonly GlossaryEntry[]): boolean {
	return new Set(defined(glossary).map(nameKey)).size >= MIN_DEFINITION_TERMS;
}

function wrongNames(
	term: GlossaryEntry,
	glossary: readonly GlossaryEntry[],
	random: () => number
): string[] {
	const others = shuffle(
		glossary.filter((entry) => nameKey(entry) !== nameKey(term)),
		random
	).sort((a, b) => Number(b.category === term.category) - Number(a.category === term.category));
	const names = new Map(others.map((entry) => [nameKey(entry), entry.name]));
	return [...names.values()].slice(0, 3);
}

export function definitionItems(
	glossary: readonly GlossaryEntry[],
	count: number,
	random: () => number = Math.random
): DefinitionItem[] {
	if (!definitionsOffered(glossary)) return [];
	return shuffle(defined(glossary), random)
		.slice(0, count)
		.map((term) => {
			const options = [term.name, ...wrongNames(term, glossary, random)].map((label) => ({
				label
			}));
			return {
				mode: 'quiz_definition' as const,
				term,
				quiz: shuffleQuiz({ options, answer: 0 }, random)
			};
		});
}

export function withDefinitions(
	items: ReviewItem[],
	definitions: DefinitionItem[],
	random: () => number = Math.random
): SessionStep[] {
	if (items.length === 0) return items;
	return definitions.reduce<SessionStep[]>((steps, definition) => {
		const index = 1 + Math.min(steps.length - 1, Math.floor(random() * steps.length));
		return [...steps.slice(0, index), definition, ...steps.slice(index)];
	}, items);
}

export function sessionSteps(
	items: ReviewItem[],
	glossary: readonly GlossaryEntry[],
	count: number,
	random: () => number = Math.random
): SessionStep[] {
	return withDefinitions(items, definitionItems(glossary, count, random), random);
}
