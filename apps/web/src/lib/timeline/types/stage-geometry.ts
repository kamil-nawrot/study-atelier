import type { Orientation } from './orientation.ts';
import type { View } from './view.ts';

export type StageGeometry = {
	orientation: Orientation;
	length: number;
	breadth: number;
	view: View;
	position: (time: number) => number;
	lane: number;
	eventsFrom: number;
	eventsSize: number;
	artworksFrom: number;
	artworksSize: number;
	artworkLane: number;
};
