import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { ClassGroup } from '#lib/images/types/class-group.ts';
import type { WikidataArtwork } from '#lib/images/types/wikidata-artwork.ts';

export type ClassGroups = ReadonlyMap<string, ClassGroup | null>;

export function artworkGroup(artwork: WikidataArtwork, groups: ClassGroups): ClassGroup | null {
	const found = artwork.types.map((type) => groups.get(type) ?? null);
	if (found.includes('artwork')) return 'artwork';
	if (found.includes('building')) return 'building';
	return null;
}

export function isConfidentArtwork(artwork: WikidataArtwork, groups: ClassGroups): boolean {
	const evidence = artwork.hasCreator || artwork.inCollection;
	if (artwork.isClass && !evidence) return false;
	return evidence || artwork.types.length === 0 || artwork.types.some((type) => !!groups.get(type));
}

export function preferredGroup(typeCode: ArtworkTypeCode | ''): ClassGroup | null {
	if (typeCode === '') return null;
	return typeCode === 'architecture' ? 'building' : 'artwork';
}

export function typeDistance(
	artwork: WikidataArtwork,
	groups: ClassGroups,
	preferred: ClassGroup | null
): number {
	return preferred === null || artworkGroup(artwork, groups) === preferred ? 0 : 1;
}

export function yearDistance(artwork: WikidataArtwork, year: number | null): number {
	if (year === null) return 0;
	return artwork.date ? Math.abs(artwork.date.year - year) : Number.POSITIVE_INFINITY;
}
