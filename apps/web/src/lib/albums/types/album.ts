import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { AlbumArtwork } from './album-artwork.ts';
import type { AlbumEvent } from './album-event.ts';
import type { AlbumTerm } from './album-term.ts';
import type { AlbumValue } from './album-value.ts';

export type Album = {
	slug: string;
	language: string;
	eraCode: EraCode;
	title: string;
	description: string;
	artworks: AlbumArtwork[];
	values: AlbumValue[];
	terms: AlbumTerm[];
	events: AlbumEvent[];
};
