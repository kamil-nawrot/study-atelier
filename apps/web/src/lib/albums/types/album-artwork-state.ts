export type AlbumArtworkState =
	{ kind: 'new' } | { kind: 'owned'; number: number } | { kind: 'similar'; number: number };
