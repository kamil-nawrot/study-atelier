import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';

export function emptyPlaceStarter(): PlaceStarter {
	return { museums: [], notes: {} };
}
