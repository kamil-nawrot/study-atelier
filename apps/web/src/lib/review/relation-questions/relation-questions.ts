import { relationTypeOf } from '#lib/artwork-relations/relation-types/relation-types.ts';
import { authorRelationTypeOf } from '#lib/author-relations/author-relation-types/author-relation-types.ts';
import type { RelationSide } from '#lib/artwork-relations/types/relation-side.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { reviewableArtworks } from '#lib/review/queue/queue.ts';
import { shuffle } from '#lib/review/quiz/quiz.ts';
import type { RelationItem } from '#lib/review/types/relation-item.ts';
import type { RelationQuestion } from '#lib/review/types/relation-question.ts';
import type { ReviewRelations } from '#lib/review/types/review-relations.ts';

const DISTRACTORS = 3;
const SIDES: readonly RelationSide[] = ['from', 'to'];

type Candidate = {
	question: RelationQuestion;
	key: string;
	author?: string;
	artwork: WallArtwork;
	answer: string;
	others: string[];
};

function label(text: string): string {
	return text.trim().toLocaleLowerCase('pl');
}

function neighbours(links: readonly { from: string; to: string }[]): Map<string, Set<string>> {
	const near = new Map<string, Set<string>>();
	const add = (one: string, other: string): void => {
		near.set(one, (near.get(one) ?? new Set([one])).add(other));
	};
	for (const { from, to } of links) {
		add(from, to);
		add(to, from);
	}
	return near;
}

function distinct(values: readonly string[], taken: ReadonlySet<string>): string[] {
	const seen = new Set(taken);
	return values.filter((value) => {
		const key = label(value);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function artworkCandidates(
	relations: ReviewRelations,
	atelier: readonly WallArtwork[],
	pool: readonly WallArtwork[]
): Candidate[] {
	const byId = new Map(atelier.map((artwork) => [artwork.id, artwork]));
	const shown = new Set(pool.map((artwork) => artwork.id));
	const near = neighbours(relations.artworks);
	return relations.artworks.flatMap((link) =>
		SIDES.flatMap((side) => {
			const subject = byId.get(side === 'from' ? link.from : link.to);
			const other = byId.get(side === 'from' ? link.to : link.from);
			const question = relationTypeOf(link.kind, side);
			if (!subject || !other || !question || question === 'related') return [];
			if (!shown.has(subject.id)) return [];
			const related = near.get(subject.id) ?? new Set();
			const titles = new Set(
				atelier.filter((artwork) => related.has(artwork.id)).map((artwork) => label(artwork.title))
			);
			const others = atelier
				.filter((artwork) => !related.has(artwork.id))
				.map((artwork) => artwork.title);
			return [
				{
					question,
					key: `artwork:${link.from}|${link.to}`,
					artwork: subject,
					answer: other.title,
					others: distinct(others, titles)
				}
			];
		})
	);
}

function authorCandidates(
	relations: ReviewRelations,
	atelier: readonly WallArtwork[],
	pool: readonly WallArtwork[],
	random: () => number
): Candidate[] {
	const near = neighbours(
		relations.authors.map(({ from, to }) => ({ from: label(from), to: label(to) }))
	);
	const names = atelier.flatMap((artwork) => artwork.authors);
	return relations.authors.flatMap((link) =>
		SIDES.flatMap((side) => {
			const subject = side === 'from' ? link.from : link.to;
			const other = side === 'from' ? link.to : link.from;
			const question = authorRelationTypeOf(link.kind, side);
			const works = pool.filter((artwork) =>
				artwork.authors.some((name) => label(name) === label(subject))
			);
			if (!question || question === 'related' || works.length === 0) return [];
			const related = near.get(label(subject)) ?? new Set();
			return [
				{
					question,
					key: `author:${label(link.from)}|${label(link.to)}`,
					author: subject,
					artwork: works[Math.floor(random() * works.length)],
					answer: other,
					others: distinct(names, related)
				}
			];
		})
	);
}

function relationItem(candidate: Candidate, random: () => number): RelationItem {
	const { answer, others, ...item } = candidate;
	const labels = shuffle([answer, ...shuffle(others, random).slice(0, DISTRACTORS)], random);
	return {
		mode: 'quiz_relation',
		...item,
		quiz: {
			options: labels.map((text) => ({ label: text })),
			answer: labels.indexOf(answer)
		}
	};
}

export function relationItems(
	relations: ReviewRelations,
	atelier: WallArtwork[],
	count: number,
	random: () => number = Math.random
): RelationItem[] {
	const pool = reviewableArtworks(atelier);
	const candidates = shuffle(
		[
			...artworkCandidates(relations, atelier, pool),
			...authorCandidates(relations, atelier, pool, random)
		].filter((candidate) => candidate.others.length >= DISTRACTORS),
		random
	);
	const keys = new Set<string>();
	const items: RelationItem[] = [];
	for (const candidate of candidates) {
		if (items.length >= count) break;
		if (keys.has(candidate.key)) continue;
		keys.add(candidate.key);
		items.push(relationItem(candidate, random));
	}
	return items;
}
