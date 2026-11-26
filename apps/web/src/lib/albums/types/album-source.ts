import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { AlbumArtwork } from './album-artwork.ts';
import type { AlbumEvent } from './album-event.ts';
import type { AlbumTerm } from './album-term.ts';
import type { AlbumValue } from './album-value.ts';

export type AlbumSource = {
	eraCode: EraCode;
	artworks: Omit<AlbumArtwork, 'title' | 'alternativeTitles' | 'description'>[];
	values: Omit<AlbumValue, 'name' | 'alternativeNames' | 'summary' | 'description' | 'country'>[];
	terms: Omit<AlbumTerm, 'name' | 'alternativeNames' | 'definition' | 'country' | 'source'>[];
	events: Omit<AlbumEvent, 'name' | 'description' | 'source'>[];
};
