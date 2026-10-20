import { describe, expect, it } from 'vitest';
import { boxStyle, orientationFor, stageGeometry, stageSize, verticalLength } from './stage.ts';

const view = { center: 1640, span: 300 };

describe('stage geometry', () => {
	it('lays time out from left to right on a larger screen and from top to bottom on a phone', () => {
		expect(orientationFor(1280)).toBe('horizontal');
		expect(orientationFor(390)).toBe('vertical');
		const wide = stageGeometry(view, 1200, 2);
		expect(wide.length).toBe(1200);
		expect(wide.position(1640)).toBe(600);
		const narrow = stageGeometry(view, 390, 3, 'vertical', 844);
		expect(narrow.length).toBe(verticalLength(844));
		expect(narrow.position(1640)).toBe(narrow.length / 2);
		expect(narrow.artworksFrom + narrow.artworksSize).toBeLessThan(390);
		expect(stageSize(narrow)).toEqual({ width: 390, height: narrow.length });
	});

	it('splits the artworks zone into lanes of at least 72 px on a larger screen', () => {
		const one = stageGeometry(view, 1200, 2);
		expect(one.artworkLane).toBe(one.artworksSize);
		const two = stageGeometry(view, 1200, 2, 'horizontal', 0, 2);
		expect(two.artworksSize).toBe(one.artworksSize);
		expect(two.artworkLane).toBe(one.artworksSize / 2);
		const five = stageGeometry(view, 1200, 2, 'horizontal', 0, 5);
		expect(five.artworkLane).toBe(72);
		expect(five.artworksSize).toBe(360);
		expect(stageGeometry(view, 390, 3, 'vertical', 844, 5).artworkLane).toBe(
			stageGeometry(view, 390, 3, 'vertical', 844).artworksSize
		);
	});

	it('leaves no room for events when the band is hidden', () => {
		const shown = stageGeometry(view, 1200, 2);
		const hidden = stageGeometry(view, 1200, 0);
		expect(hidden.eventsSize).toBe(0);
		expect(hidden.artworksFrom).toBeLessThan(shown.artworksFrom);
		const vertical = stageGeometry(view, 390, 0, 'vertical', 844);
		expect(vertical.artworksFrom).toBe(vertical.eventsFrom);
	});

	it('keeps the vertical stage between its limits', () => {
		expect(verticalLength(400)).toBe(440);
		expect(verticalLength(2000)).toBe(820);
	});

	it('places a box along and across the time axis', () => {
		expect(boxStyle(stageGeometry(view, 1200, 1), { along: 10, across: 20, alongSize: 30 })).toBe(
			'left: 10px; top: 20px; width: 30px'
		);
		expect(
			boxStyle(stageGeometry(view, 390, 1, 'vertical', 844), {
				along: 10,
				across: 20,
				acrossSize: 5
			})
		).toBe('top: 10px; left: 20px; width: 5px');
	});
});
