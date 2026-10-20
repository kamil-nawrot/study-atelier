import type { WallArtwork } from '#lib/collection/types.ts';
import type { Quiz, QuizOption, ReviewCard, ReviewItem, SessionRow } from './types.ts';

export const QUIZ_TILE_SIZES = '(min-width: 768px) 25vw, 45vw';

function shuffle<T>(values: T[], random: () => number): T[] {
	const shuffled = [...values];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const other = Math.min(index, Math.floor(random() * (index + 1)));
		[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
	}
	return shuffled;
}

export function shuffleQuiz(quiz: Quiz, random: () => number = Math.random): Quiz {
	const right = quiz.options[quiz.answer];
	const options = shuffle(quiz.options, random);
	return { options, answer: options.indexOf(right) };
}

function quizOf(row: SessionRow, artworks: Map<string, WallArtwork>): Quiz | undefined {
	const options: QuizOption[] = [];
	for (const option of row.options ?? []) {
		const artwork = option.artwork_id ? artworks.get(option.artwork_id) : undefined;
		if (option.artwork_id && !artwork) return undefined;
		options.push({
			label: option.label,
			...(artwork ? { artwork } : {}),
			...(option.reason ? { reason: option.reason } : {})
		});
	}
	const answer = (row.options ?? []).findIndex((option) => option.right);
	return answer === -1 ? undefined : { options, answer };
}

export function sessionItems(
	rows: SessionRow[],
	artworks: Map<string, WallArtwork>,
	cards: Map<string, ReviewCard>
): ReviewItem[] {
	return rows.flatMap((row) => {
		const artwork = artworks.get(row.artwork_id);
		if (!artwork) return [];
		const card = cards.get(row.artwork_id) ?? null;
		const quiz = row.mode === 'flashcard' ? undefined : quizOf(row, artworks);
		return [quiz ? { artwork, card, mode: row.mode, quiz } : { artwork, card, mode: 'flashcard' }];
	});
}

export function quizArtworks(items: ReviewItem[]): WallArtwork[] {
	return items.flatMap(
		(item) => item.quiz?.options.flatMap((option) => option.artwork ?? []) ?? []
	);
}
