import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
import type { FlagItem } from '#lib/backroom/types/flag-item.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { Quiz } from '#lib/review/types/quiz.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

type ArtworkRole = { main?: boolean; answers?: boolean; note?: boolean };

function artworkFlag(artwork: WallArtwork): FlagItem & { kind: 'artwork' } {
	return { kind: 'artwork', id: artwork.id, title: artwork.title };
}

function artworkGroup(
	item: FlagItem & { kind: 'artwork' },
	hasImage: boolean,
	role: ArtworkRole = {}
): FlagGroup {
	const reasons: FlagReason[] = [
		...(hasImage ? (['image'] as const) : []),
		...(item.pin ? (['pin'] as const) : []),
		'data',
		...(role.note ? (['note'] as const) : []),
		...(role.answers ? (['answers'] as const) : []),
		'other'
	];
	return { item, reasons };
}

function optionArtworks(quiz: Quiz | undefined): WallArtwork[] {
	return (quiz?.options ?? []).flatMap((option) => (option.artwork ? [option.artwork] : []));
}

function withOptions(main: FlagGroup[], quiz: Quiz | undefined): FlagGroup[] {
	const seen = new Set(main.map((group) => group.item.id));
	const others = optionArtworks(quiz).filter(
		(artwork) => !seen.has(artwork.id) && seen.add(artwork.id)
	);
	return [
		...main,
		...others.map((artwork) => artworkGroup(artworkFlag(artwork), artwork.hasImage))
	];
}

function reviewItemGroups(step: ReviewItem): FlagGroup[] {
	const item = artworkFlag(step.artwork);
	const pinned = step.pin?.image.id
		? { ...item, pin: { imageId: step.pin.image.id, x: step.pin.x, y: step.pin.y } }
		: item;
	const asks = step.quiz !== undefined && step.mode !== 'quiz_image' && step.mode !== 'quiz_typed';
	const main = artworkGroup(pinned, step.artwork.hasImage, { note: true, answers: asks });
	return withOptions([main], step.mode === 'quiz_image' ? step.quiz : undefined);
}

function pairGroups(step: SessionStep & { mode: 'quiz_pair' }): FlagGroup[] {
	const right = step.quiz.options[step.quiz.answer]?.artwork;
	return optionArtworks(step.quiz).map((artwork) =>
		artworkGroup(artworkFlag(artwork), artwork.hasImage, { answers: artwork.id === right?.id })
	);
}

export function stepGroups(step: SessionStep): FlagGroup[] {
	switch (step.mode) {
		case 'quiz_definition':
			return [
				{
					item: { kind: 'term', id: step.term.id, name: step.term.name },
					reasons: ['hidden', 'definition', 'answers', 'other']
				}
			];
		case 'quiz_symbol':
			return [
				{ item: { kind: 'symbol', ...step.symbol }, reasons: ['meaning', 'answers', 'other'] }
			];
		case 'note_gap':
			return [
				{
					item: { kind: 'term', id: step.term.id, name: step.term.name },
					reasons: ['hidden', 'answers', 'other']
				},
				{ item: artworkFlag(step.artwork), reasons: ['note', 'other'] }
			];
		case 'quiz_pair':
			return pairGroups(step);
		case 'quiz_relation':
			return withOptions(
				[artworkGroup(artworkFlag(step.artwork), step.artwork.hasImage, { answers: true })],
				step.quiz
			);
		case 'year':
			return [artworkGroup(artworkFlag(step.artwork), step.artwork.hasImage)];
		case 'order':
			return step.artworks.map((artwork) => artworkGroup(artworkFlag(artwork), artwork.hasImage));
		default:
			return reviewItemGroups(step);
	}
}
