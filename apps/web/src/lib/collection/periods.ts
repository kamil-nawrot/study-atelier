import { ERA_CODES, eraName } from './eras.ts';
import type { EraCode, PeriodGroup, WallArtwork } from './types.ts';

function byYear(a: WallArtwork, b: WallArtwork): number {
	if (a.yearTo === null && b.yearTo === null) return a.number - b.number;
	if (a.yearTo === null) return 1;
	if (b.yearTo === null) return -1;
	return a.yearTo - b.yearTo || a.number - b.number;
}

export function groupByEra(artworks: WallArtwork[]): PeriodGroup[] {
	const groups = new Map<EraCode, WallArtwork[]>();
	for (const artwork of artworks) {
		if (artwork.eraCode === null) continue;
		groups.set(artwork.eraCode, [...(groups.get(artwork.eraCode) ?? []), artwork]);
	}

	return ERA_CODES.flatMap((code): PeriodGroup[] => {
		const members = groups.get(code);
		if (!members) return [];
		const starts = members.flatMap((artwork) => artwork.yearFrom ?? artwork.yearTo ?? []);
		const ends = members.flatMap((artwork) => artwork.yearTo ?? []);
		return [
			{
				code,
				name: eraName(code),
				from: starts.length > 0 ? Math.min(...starts) : null,
				to: ends.length > 0 ? Math.max(...ends) : null,
				artworks: members.sort(byYear)
			}
		];
	});
}
