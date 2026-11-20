import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import { eraJunctions } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type EraGroup<T> = { code: EraCode; records: T[] };

export type EraGrouping<T> = { eras: EraGroup<T>[]; outside: T[] };

function eraIndexFrom(year: number, junctions: readonly number[]): number {
	return junctions.filter((junction) => junction <= year).length;
}

function eraIndexTo(year: number, junctions: readonly number[]): number {
	return junctions.filter((junction) => junction < year).length;
}

export function erasOfYears(
	yearFrom: number | null,
	yearTo: number,
	junctions: readonly number[] = eraJunctions()
): EraCode[] {
	const first = eraIndexFrom(yearFrom ?? yearTo, junctions);
	const last = yearFrom === null ? first : Math.max(first, eraIndexTo(yearTo, junctions));
	return ERA_CODES.slice(first, last + 1);
}

export type EraAuthor = Pick<CardIndexRecord, 'id' | 'name' | 'sortName' | 'count'> & {
	year?: number;
};

function inEra(author: CardIndexRecord, count: number, oldestYear?: number): EraAuthor {
	return {
		id: author.id,
		name: author.name,
		count,
		...(author.sortName === undefined ? {} : { sortName: author.sortName }),
		...(oldestYear === undefined ? {} : { year: oldestYear })
	};
}

export function groupAuthors(
	data: CardIndexData,
	authors: readonly CardIndexRecord[]
): EraGrouping<EraAuthor> {
	const byId = new Map(authors.map((author) => [author.id, author]));
	const withEra = new Set(data.authorEras.map((link) => link.authorId));
	return {
		eras: ERA_CODES.map((code) => ({
			code,
			records: data.authorEras
				.filter((link) => link.eraCode === code)
				.flatMap((link) => {
					const author = byId.get(link.authorId);
					return author ? [inEra(author, link.count, link.oldestYear)] : [];
				})
		})),
		outside: authors
			.filter((author) => !withEra.has(author.id))
			.map((author) => inEra(author, author.count))
	};
}

export function groupEvents<T extends { yearFrom: number | null; yearTo: number }>(
	events: readonly T[],
	junctions: readonly number[] = eraJunctions()
): EraGroup<T>[] {
	return ERA_CODES.map((code) => ({
		code,
		records: events.filter((event) =>
			erasOfYears(event.yearFrom, event.yearTo, junctions).includes(code)
		)
	}));
}
