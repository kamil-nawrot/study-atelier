import { overlaps, spanOfYears, type Era } from '#lib/timeline/time/time.ts';

export type Dated = {
	id: string;
	yearFrom: number | null;
	yearTo: number | null;
};

export type Mark<T extends Dated> = {
	item: T;
	start: number;
	end: number;
	cutBefore: boolean;
	cutAfter: boolean;
	at: number;
};

export const DOT_SIZE = 10;
const CANDIDATES = 14;
const NEIGHBOURHOOD = 40;

export function marksIn<T extends Dated>(items: readonly T[], era: Era): Mark<T>[] {
	return items
		.flatMap((item) => {
			if (item.yearTo === null) return [];
			const span = spanOfYears(item.yearFrom, item.yearTo);
			if (!overlaps(span, era)) return [];
			const start = Math.max(span.start, era.start);
			const end = Math.min(span.end, era.end);
			return [
				{
					item,
					start,
					end,
					cutBefore: span.start < era.start,
					cutAfter: span.end > era.end,
					at: Math.min(span.end, era.end) - 0.5
				}
			];
		})
		.sort((a, b) => a.at - b.at || a.item.id.localeCompare(b.item.id));
}

export function seeded(key: string, round: number): number {
	let hash = 2166136261;
	for (const char of `${key}:${round}`) {
		hash ^= char.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0) / 4294967296;
}

export function spread(
	keys: readonly string[],
	positions: readonly number[],
	height: number
): number[] {
	const placed: { at: number; across: number }[] = [];
	return keys.map((key, index) => {
		const at = positions[index];
		let best = seeded(key, 0) * height;
		let bestScore = -1;
		for (let round = 0; round < CANDIDATES; round++) {
			const across = seeded(key, round) * height;
			let score = Infinity;
			for (let other = placed.length - 1; other >= 0; other--) {
				if (at - placed[other].at > NEIGHBOURHOOD) break;
				score = Math.min(score, Math.hypot(at - placed[other].at, across - placed[other].across));
			}
			if (score > bestScore) {
				bestScore = score;
				best = across;
			}
			if (score === Infinity) break;
		}
		placed.push({ at, across: best });
		return best;
	});
}
