import type { WallArtwork } from '#lib/collection/types.ts';

export function testArtwork(
	number: number,
	title: string,
	overrides: Partial<WallArtwork> = {}
): WallArtwork {
	return {
		id: `artwork-${number}`,
		number,
		title,
		authors: ['Test Painter'],
		date: '1900',
		year: 1900,
		periods: [],
		image: { src: `data:image/gif;base64,R0lGODlhAQABAAAAACw=`, width: 4, height: 5 },
		...overrides
	};
}
