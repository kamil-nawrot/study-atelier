export type ImageSearchQuery =
	{ kind: 'artwork'; title: string; authors: string[] } | { kind: 'person'; name: string };
