import type { SvelteSet } from 'svelte/reactivity';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type WallSource = {
	artworks: WallArtwork[];
	ownFields?: OwnFieldDefinition[];
	query: string;
	collapsed: SvelteSet<string>;
};
