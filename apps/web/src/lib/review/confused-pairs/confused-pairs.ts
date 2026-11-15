import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { reviewableArtworks } from '#lib/review/queue/queue.ts';
import { shuffle } from '#lib/review/quiz/quiz.ts';
import type { ConfusedPair } from '#lib/review/types/confused-pair.ts';
import type { PairItem } from '#lib/review/types/pair-item.ts';
import type { PairKind } from '#lib/review/types/pair-kind.ts';

export const PAIR_SHARE = 10;
export const MIN_PAIRS = 2;
export const MAX_PAIRS = 4;

export function pairCount(sessionSize: number): number {
	return Math.min(MAX_PAIRS, Math.max(MIN_PAIRS, Math.floor(sessionSize / PAIR_SHARE)));
}

function key(text: string): string {
	return text.trim().toLocaleLowerCase('pl');
}

function holds(artwork: WallArtwork, kind: PairKind, value: string): boolean {
	return kind === 'author'
		? key(artwork.authors.join(', ')) === key(value)
		: artwork.styles.some((style) => key(style) === key(value));
}

function drawOne(
	pool: WallArtwork[],
	pair: ConfusedPair,
	value: string,
	other: string,
	random: () => number
): WallArtwork | undefined {
	const fitting = pool.filter(
		(artwork) => holds(artwork, pair.kind, value) && !holds(artwork, pair.kind, other)
	);
	return fitting[Math.floor(random() * fitting.length)];
}

function pairItem(
	pool: WallArtwork[],
	pair: ConfusedPair,
	random: () => number
): PairItem | undefined {
	const first = drawOne(pool, pair, pair.first, pair.second, random);
	const second = drawOne(pool, pair, pair.second, pair.first, random);
	if (!first || !second) return undefined;
	const askFirst = random() < 0.5;
	const asked = askFirst ? first : second;
	const options = shuffle(
		[first, second].map((artwork) => ({ label: artwork.title, artwork })),
		random
	);
	return {
		mode: 'quiz_pair',
		kind: pair.kind,
		key: `${pair.kind}:${key(pair.first)}|${key(pair.second)}`,
		asked: askFirst ? pair.first : pair.second,
		other: askFirst ? pair.second : pair.first,
		quiz: { options, answer: options.findIndex((option) => option.artwork === asked) }
	};
}

export function pairItems(
	pairs: readonly ConfusedPair[],
	artworks: WallArtwork[],
	count: number,
	random: () => number = Math.random
): PairItem[] {
	const pool = reviewableArtworks(artworks);
	const items: PairItem[] = [];
	for (const pair of pairs) {
		if (items.length >= count) break;
		const item = pairItem(pool, pair, random);
		if (item) items.push(item);
	}
	return items;
}

export function pairArtworks(items: readonly PairItem[]): WallArtwork[] {
	return items.flatMap((item) =>
		item.quiz.options.flatMap((option) => (option.artwork ? [option.artwork] : []))
	);
}
