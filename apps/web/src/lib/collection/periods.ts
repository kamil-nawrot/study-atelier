import { ERA_CODES, eraName } from './eras.ts';
import type { EraCode, PeriodGroup, WallArtwork } from './types.ts';

function byYear(a: WallArtwork, b: WallArtwork): number {
	if (a.year === null && b.year === null) return a.number - b.number;
	if (a.year === null) return 1;
	if (b.year === null) return -1;
	return a.year - b.year || a.number - b.number;
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
		const years = members.flatMap((artwork) => artwork.year ?? []);
		return [
			{
				code,
				name: eraName(code),
				from: years.length > 0 ? Math.min(...years) : null,
				to: years.length > 0 ? Math.max(...years) : null,
				artworks: members.sort(byYear)
			}
		];
	});
}
