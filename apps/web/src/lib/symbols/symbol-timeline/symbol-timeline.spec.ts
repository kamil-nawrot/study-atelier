import { describe, expect, it } from 'vitest';
import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';
import { symbolTimeline } from './symbol-timeline.ts';

function detail(pinId: string, year: number | null): SymbolDetail {
	return { pinId, meaningId: null, artworkId: pinId, number: 1, title: pinId, byline: '', year };
}

describe('symbolTimeline', () => {
	it('places the details between whole centuries', () => {
		const timeline = symbolTimeline([detail('b', 1606), detail('a', 1533), detail('c', 1901)]);

		expect(timeline?.ticks.map((tick) => tick.year)).toEqual([1500, 1600, 1700, 1800, 1900, 2000]);
		expect(timeline?.placed.map((placed) => placed.detail.pinId)).toEqual(['a', 'b', 'c']);
		expect(timeline?.placed[0].left).toBeCloseTo(6.6);
	});

	it('spans at least one century', () => {
		const timeline = symbolTimeline([detail('a', 1500)]);

		expect(timeline?.ticks.map((tick) => tick.year)).toEqual([1500, 1600]);
		expect(timeline?.placed[0].left).toBe(0);
	});

	it('handles years before the common era', () => {
		const timeline = symbolTimeline([detail('a', -450), detail('b', 120)]);

		expect(timeline?.ticks[0].year).toBe(-500);
		expect(timeline?.ticks.at(-1)?.year).toBe(200);
	});

	it('shows no axis without dated details', () => {
		expect(symbolTimeline([detail('a', null)])).toBeUndefined();
		expect(symbolTimeline([])).toBeUndefined();
	});
});
