import type { AtlasSymbol } from '#lib/symbols/types/atlas-symbol.ts';
import type { SymbolDetail } from '#lib/symbols/types/symbol-detail.ts';
import type { SymbolEntry } from '#lib/symbols/types/symbol-entry.ts';
import type { SymbolPageResult } from '#lib/symbols/types/symbol-page-result.ts';

export const PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const testLens = { crop: PIXEL, thumbnail: { left: 0, top: 0, width: 100, height: 100 } };

export const testSymbol: SymbolEntry = {
	id: 'skull',
	name: 'Skull',
	meanings: [
		{ id: 'transience', text: 'transience, death', contexts: [] },
		{
			id: 'penance',
			text: 'penance',
			contexts: [
				{ kind: 'person', entryId: 'jerome', name: 'Saint Jerome' },
				{ kind: 'value', valueId: 'baroque', category: 'period', name: 'Baroque' },
				{ kind: 'text', name: 'hermit cell' }
			]
		}
	]
};

export function testDetail(pinId: string, extra: Partial<SymbolDetail> = {}): SymbolDetail {
	return {
		pinId,
		meaningId: 'penance',
		artworkId: `artwork-${pinId}`,
		number: 12,
		title: 'Saint Jerome Writing',
		byline: 'Caravaggio, 1606',
		year: 1606,
		lens: testLens,
		...extra
	};
}

export function testSymbolPage(extra: Partial<SymbolPageResult> = {}): SymbolPageResult {
	const jerome = testDetail('pin-1');
	const holbein = testDetail('pin-2', {
		meaningId: null,
		number: 3,
		title: 'The Ambassadors',
		byline: 'Hans Holbein, 1533',
		year: 1533
	});
	return {
		symbol: testSymbol,
		sections: [
			{ meaning: testSymbol.meanings[0], details: [] },
			{ meaning: testSymbol.meanings[1], details: [jerome] }
		],
		withoutMeaning: [holbein],
		details: [jerome, holbein],
		...extra
	};
}

export function testAtlasSymbol(extra: Partial<AtlasSymbol> = {}): AtlasSymbol {
	return {
		id: 'skull',
		name: 'Skull',
		createdAt: '2026-11-01T10:00:00Z',
		firstMeaning: 'transience, death',
		meaningCount: 2,
		pinCount: 3,
		cover: testLens,
		...extra
	};
}
