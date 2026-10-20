import { positionOf, type View } from './time.ts';

export const AXIS_HEIGHT = 52;
export const EVENT_LANE_HEIGHT = 28;
export const ZONE_LABEL_HEIGHT = 22;
export const ZONE_GAP = 8;
export const ARTWORKS_HEIGHT = 300;
export const ARTWORKS_HEIGHT_NARROW = 220;
export const NARROW_WIDTH = 768;

export type StageGeometry = {
	width: number;
	view: View;
	position: (time: number) => number;
	eventsTop: number;
	eventsHeight: number;
	artworksTop: number;
	artworksHeight: number;
};

export function stageGeometry(view: View, width: number, eventLanes: number): StageGeometry {
	const eventsTop = AXIS_HEIGHT + ZONE_LABEL_HEIGHT;
	const eventsHeight = eventLanes * EVENT_LANE_HEIGHT + ZONE_GAP;
	const artworksTop = eventsTop + eventsHeight + ZONE_LABEL_HEIGHT;
	return {
		width,
		view,
		position: (time) => positionOf(view, width, time),
		eventsTop,
		eventsHeight,
		artworksTop,
		artworksHeight: width < NARROW_WIDTH ? ARTWORKS_HEIGHT_NARROW : ARTWORKS_HEIGHT
	};
}

export function stageHeight(geometry: StageGeometry): number {
	return geometry.artworksTop + geometry.artworksHeight + ZONE_GAP;
}
