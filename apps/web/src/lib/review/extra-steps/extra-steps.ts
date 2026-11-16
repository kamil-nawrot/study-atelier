import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadTermDefinitions } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import { pairArtworks, pairItems } from '#lib/review/confused-pairs/confused-pairs.ts';
import {
	definitionCount,
	definitionItems,
	pickedTerms,
	withDefinitionsOf
} from '#lib/review/definitions/definitions.ts';
import { relationItems } from '#lib/review/relation-questions/relation-questions.ts';
import { loadReviewRelations } from '#lib/review/relation-questions-data/relation-questions-data.ts';
import { drawNoteGap } from '#lib/review/note-gap/note-gap.ts';
import type { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import { loadConfusedPairs, loadReviewDetails } from '#lib/review/review-data/review-data.ts';
import { loadSymbolSteps } from '#lib/review/symbol-steps/symbol-steps.ts';
import { loadExtraCards } from '#lib/review/extra-cards-data/extra-cards-data.ts';
import { timeQuestions, withTimeImages } from '#lib/review/time-questions/time-questions.ts';
import type { ReviewDetails } from '#lib/review/types/review-details.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

type ExtraInput = {
	preferences: Preferences;
	glossary: GlossaryTerm[];
	scope: ReviewScope;
	asked: WallArtwork[];
	shown: WallArtwork[];
	atelier: WallArtwork[];
	artworksById: ReadonlyMap<string, WallArtwork>;
	images: ResolvedImages;
	times: ReturnType<typeof timeQuestions>;
	now?: Date;
};

type ExtraSteps = {
	steps: SessionStep[];
	details: Map<string, ReviewDetails>;
	error?: string;
};

export async function loadExtraSteps(input: ExtraInput): Promise<ExtraSteps> {
	const { preferences, glossary, images } = input;
	const now = input.now ?? new Date();
	const cards = await loadExtraCards();
	const drawn = pickedTerms(glossary, cards.terms, definitionCount(preferences, glossary), now);
	const shownImages = images.resolve(input.shown);
	const definedRead = loadTermDefinitions(drawn.map((term) => term.id));
	const pairsRead = preferences.reviewPairsOn ? loadConfusedPairs() : Promise.resolve([]);
	const relationsRead = preferences.reviewRelationsOn
		? loadReviewRelations()
		: Promise.resolve({ artworks: [], authors: [] });
	const gaps = await drawNoteGap(
		preferences.reviewNotesOn ? preferences.reviewNoteQuestions : 0,
		input.scope,
		input.shown,
		input.artworksById,
		glossary
	);
	const gapArtworks = gaps.map((gap) => gap.artwork);
	const pairs = pairItems(await pairsRead, input.atelier, preferences.reviewPairQuestions);
	const relations = relationItems(
		await relationsRead,
		input.atelier,
		preferences.reviewRelationQuestions
	);
	const relationArtworks = relations.map((item) => item.artwork);
	const [, , , , found, defined, symbolSteps] = await Promise.all([
		shownImages,
		images.resolve(gapArtworks),
		images.resolve(pairArtworks(pairs)),
		images.resolve(relationArtworks),
		loadReviewDetails(
			[...input.asked, ...gapArtworks, ...relationArtworks].map((artwork) => artwork.id)
		),
		definedRead,
		loadSymbolSteps(
			preferences.reviewSymbolsOn ? preferences.reviewSymbolQuestions : 0,
			glossary,
			cards,
			now
		)
	]);
	return {
		details: found.details,
		...(found.error ? { error: found.error } : {}),
		steps: [
			...definitionItems(
				withDefinitionsOf(drawn, defined.definitions),
				glossary,
				Math.random,
				cards.terms
			),
			...symbolSteps,
			...gaps.map((gap) => ({ ...gap, artwork: images.withImage(gap.artwork) })),
			...pairs.map((pair) => ({
				...pair,
				quiz: {
					...pair.quiz,
					options: pair.quiz.options.map((option) =>
						option.artwork ? { ...option, artwork: images.withImage(option.artwork) } : option
					)
				}
			})),
			...relations.map((item) => ({ ...item, artwork: images.withImage(item.artwork) })),
			...input.times.map((step) => withTimeImages(step, images.withImage))
		]
	};
}
