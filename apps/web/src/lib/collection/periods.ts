import type { PeriodGroup, WallArtwork } from './types.ts';

function byYear(a: WallArtwork, b: WallArtwork): number {
	if (a.year === null && b.year === null) return a.number - b.number;
	if (a.year === null) return 1;
	if (b.year === null) return -1;
	return a.year - b.year || a.number - b.number;
}

function byFrom(a: PeriodGroup, b: PeriodGroup): number {
	if (a.from === null && b.from === null) return a.name.localeCompare(b.name, 'pl');
	if (a.from === null) return 1;
	if (b.from === null) return -1;
	return a.from - b.from || a.name.localeCompare(b.name, 'pl');
}

export function groupByPeriod(artworks: WallArtwork[]): PeriodGroup[] {
	const groups = new Map<string, WallArtwork[]>();
	for (const artwork of artworks) {
		const name = artwork.periods[0];
		if (name === undefined) continue;
		groups.set(name, [...(groups.get(name) ?? []), artwork]);
	}

	return [...groups]
		.map(([name, members]): PeriodGroup => {
			const years = members.flatMap((artwork) => artwork.year ?? []);
			return {
				name,
				from: years.length > 0 ? Math.min(...years) : null,
				to: years.length > 0 ? Math.max(...years) : null,
				artworks: members.sort(byYear)
			};
		})
		.sort(byFrom);
}
