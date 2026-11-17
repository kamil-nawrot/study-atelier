import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadTermDefinitions } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import { pairArtworks, pairItems } from '#lib/review/confused-pairs/confused-pairs.ts';
import {
	definitionCount,
	definitionItems,
	roundTerms,
	withDefinitionsOf
} from '#lib/review/definitions/definitions.ts';
import { relationItems } from '#lib/review/relation-questions/relation-questions.ts';
import { loadReviewRelations } from '#lib/review/relation-questions-data/relation-questions-data.ts';
import { drawNoteGap } from '#lib/review/note-gap/note-gap.ts';
import type { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import { loadConfusedPairs, loadReviewDetails } from '#lib/review/review-data/review-data.ts';
import { loadSymbolSteps } from '#lib/review/symbol-steps/symbol-steps.ts';
import { loadExtraRound } from '#lib/review/extra-cards-data/extra-cards-data.ts';
import { eventItems } from '#lib/review/event-questions/event-questions.ts';
import { loadTimelineEventsById } from '#lib/timeline/timeline-data/timeline-data.ts';
import { startOfDay } from '#lib/review/queue/queue.ts';
import { timeQuestions, withTimeImages } from '#lib/review/time-questions/time-questions.ts';
import type { ReviewDetails } from '#lib/review/types/review-details.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import type { Holds } from '#lib/review/types/holds.ts';
import { NO_HOLDS, withoutHeld } from '#lib/review/holds/holds.ts';

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
	holds?: Holds;
};

type ExtraSteps = {
	steps: SessionStep[];
	reserve: SessionStep[];
	details: Map<string, ReviewDetails>;
	error?: string;
};

export async function loadExtraSteps(input: ExtraInput): Promise<ExtraSteps> {
	const { preferences, glossary, images } = input;
	const now = input.now ?? new Date();
	const holds = input.holds ?? NO_HOLDS;
	const roundRead = loadExtraRound(startOfDay(now));
	const termCount = definitionCount(preferences);
	const symbolCount = preferences.reviewSymbolsOn ? preferences.reviewSymbolQuestions : 0;
	const eventCount = preferences.reviewEventsOn ? preferences.reviewEventQuestions : 0;
	const shownImages = images.resolve(input.shown);
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
	const round = await roundRead;
	const eventsRead = loadTimelineEventsById(round.events.map((event) => event.eventId));
	const drawn = roundTerms(round.terms, glossary);
	const definedRead = loadTermDefinitions(drawn.map((term) => term.id));
	const gapArtworks = gaps.map((gap) => gap.artwork);
	const pairs = pairItems(await pairsRead, input.atelier, preferences.reviewPairQuestions);
	const relations = relationItems(
		await relationsRead,
		input.atelier,
		preferences.reviewRelationQuestions
	);
	const relationArtworks = relations.map((item) => item.artwork);
	const [, , , , found, defined, symbolSteps, events] = await Promise.all([
		shownImages,
		images.resolve(gapArtworks),
		images.resolve(pairArtworks(pairs)),
		images.resolve(relationArtworks),
		loadReviewDetails(
			[...input.asked, ...gapArtworks, ...relationArtworks].map((artwork) => artwork.id)
		),
		definedRead,
		loadSymbolSteps(round.symbols, glossary),
		eventsRead
	]);
	const definitions = definitionItems(
		withDefinitionsOf(drawn, defined.definitions),
		glossary,
		Math.random,
		new Map(round.terms.flatMap(({ id, card }) => (card ? [[id, card]] : [])))
	);
	return {
		details: found.details,
		...(found.error ? { error: found.error } : {}),
		reserve: [...definitions.slice(termCount), ...symbolSteps.slice(symbolCount)],
		steps: withoutHeld(
			[
				...definitions.slice(0, termCount),
				...symbolSteps.slice(0, symbolCount),
				...eventItems(round.events, events).slice(0, eventCount),
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
			],
			holds
		)
	};
}
