import { positionOf } from '#lib/timeline/time/time.ts';
import type { View } from '#lib/timeline/types/view.ts';
import type { Orientation } from '#lib/timeline/types/orientation.ts';
import type { StageGeometry } from '#lib/timeline/types/stage-geometry.ts';

export const NARROW_WIDTH = 768;
export const ZONE_GAP = 8;

const AXIS_HEIGHT = 52;
const ZONE_LABEL_HEIGHT = 22;
const LANE_HORIZONTAL = 28;
const ARTWORKS_HEIGHT = 300;
const ARTWORKS_HEIGHT_NARROW = 220;
const ARTWORK_LANE_MIN = 72;

const AXIS_WIDTH = 64;
const LANE_VERTICAL = 22;
const VERTICAL_SHARE = 0.66;
const VERTICAL_MIN = 440;
const VERTICAL_MAX = 820;

type Box = {
	along: number;
	across: number;
	alongSize?: number;
	acrossSize?: number;
};

export function orientationFor(width: number): Orientation {
	return width > 0 && width < NARROW_WIDTH ? 'vertical' : 'horizontal';
}

export function verticalLength(viewportHeight: number): number {
	return Math.round(
		Math.min(Math.max(viewportHeight * VERTICAL_SHARE, VERTICAL_MIN), VERTICAL_MAX)
	);
}

export function stageGeometry(
	view: View,
	width: number,
	eventLanes: number,
	orientation: Orientation = 'horizontal',
	viewportHeight = 0,
	artworkLanes = 0
): StageGeometry {
	if (orientation === 'vertical') {
		const length = verticalLength(viewportHeight);
		const eventsFrom = AXIS_WIDTH + ZONE_GAP;
		const eventsSize = eventLanes * LANE_VERTICAL;
		const artworksFrom = eventsFrom + eventsSize + (eventLanes > 0 ? 2 * ZONE_GAP : 0);
		const artworksSize = Math.max(width - artworksFrom - ZONE_GAP, 1);
		return {
			orientation,
			length,
			breadth: width,
			view,
			position: (time) => positionOf(view, length, time),
			lane: LANE_VERTICAL,
			eventsFrom,
			eventsSize,
			artworksFrom,
			artworksSize,
			artworkLane: artworksSize
		};
	}
	const eventsFrom = AXIS_HEIGHT + (eventLanes > 0 ? ZONE_LABEL_HEIGHT : 0);
	const eventsSize = eventLanes > 0 ? eventLanes * LANE_HORIZONTAL + ZONE_GAP : 0;
	const artworksFrom = eventsFrom + eventsSize + ZONE_LABEL_HEIGHT;
	const height = width < NARROW_WIDTH ? ARTWORKS_HEIGHT_NARROW : ARTWORKS_HEIGHT;
	const artworkLane = artworkLanes > 0 ? Math.max(height / artworkLanes, ARTWORK_LANE_MIN) : height;
	const artworksSize = artworkLanes > 0 ? artworkLane * artworkLanes : height;
	return {
		orientation,
		length: width,
		breadth: artworksFrom + artworksSize + ZONE_GAP,
		view,
		position: (time) => positionOf(view, width, time),
		lane: LANE_HORIZONTAL,
		eventsFrom,
		eventsSize,
		artworksFrom,
		artworksSize,
		artworkLane
	};
}

export function stageSize(geometry: StageGeometry): { width: number; height: number } {
	return geometry.orientation === 'vertical'
		? { width: geometry.breadth, height: geometry.length }
		: { width: geometry.length, height: geometry.breadth };
}

export function boxStyle(geometry: StageGeometry, box: Box): string {
	const vertical = geometry.orientation === 'vertical';
	const parts: [string, number | undefined][] = [
		[vertical ? 'top' : 'left', box.along],
		[vertical ? 'left' : 'top', box.across],
		[vertical ? 'height' : 'width', box.alongSize],
		[vertical ? 'width' : 'height', box.acrossSize]
	];
	return parts
		.filter((part): part is [string, number] => part[1] !== undefined)
		.map(([property, value]) => `${property}: ${value}px`)
		.join('; ');
}
