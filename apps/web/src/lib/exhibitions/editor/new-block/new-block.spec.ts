import { describe, expect, it } from 'vitest';
import {
	artworkNode,
	closeUpNode,
	headingNode,
	headingText,
	kindOf,
	quoteNode,
	quoteText,
	symbolNode,
	termNode,
	textNode,
	withMeaning
} from '#lib/exhibitions/editor/new-block/new-block.ts';

describe('new blocks', () => {
	it('names the kind of a stored block', () => {
		expect(kindOf(artworkNode('a1'))).toBe('artwork');
		expect(kindOf(artworkNode('a1', true))).toBe('palette');
		expect(kindOf(textNode('quote'))).toBe('quote');
		expect(kindOf({})).toBe('textBlock');
		expect(kindOf({ type: 'set', content: [artworkNode('a1', true)] })).toBe('palette');
	});

	it('creates empty texts of every kind', () => {
		expect(textNode('textBlock')).toEqual({ type: 'textBlock', content: [{ type: 'paragraph' }] });
		expect(textNode('heading')).toEqual({ type: 'heading', attrs: { level: 2 } });
		expect(textNode('quote')).toEqual({ type: 'quote', content: [{ type: 'paragraph' }] });
		expect(textNode('divider')).toEqual({ type: 'divider' });
		expect(termNode('t1')).toEqual({ type: 'term', attrs: { termId: 't1' } });
		expect(kindOf(termNode('t1'))).toBe('term');
		expect(kindOf(textNode('divider'))).toBe('divider');
	});

	it('stores a symbol by its id and narrows it to one meaning or back to all', () => {
		const symbol = symbolNode('s1');
		expect(symbol).toEqual({ type: 'symbol', attrs: { symbolId: 's1' } });
		expect(kindOf(symbol)).toBe('symbol');
		const narrowed = withMeaning({ ...symbol, attrs: { ...symbol.attrs, align: 'center' } }, 'm1');
		expect(narrowed.attrs).toEqual({ symbolId: 's1', align: 'center', meaningId: 'm1' });
		expect(withMeaning(narrowed).attrs).toEqual({ symbolId: 's1', align: 'center' });
	});

	it('stores a palette as an artwork that shows only its colours', () => {
		expect(artworkNode('a1', true)).toEqual({
			type: 'artwork',
			attrs: { artworkId: 'a1', paletteOnly: true }
		});
		expect(closeUpNode({ artworkId: 'a1', imageId: null, x: 0.1, y: 0.2, viewWidth: 0.3 })).toEqual(
			{
				type: 'closeUp',
				attrs: { artworkId: 'a1', imageId: null, x: 0.1, y: 0.2, viewWidth: 0.3 }
			}
		);
	});

	it('writes a heading and a quote from plain text and reads it back', () => {
		expect(headingText(headingNode('Night'))).toBe('Night');
		expect(headingNode('')).toEqual({ type: 'heading', attrs: { level: 2 } });
		const quote = quoteNode('Light\n\nis all');
		expect(quote.content).toHaveLength(3);
		expect(quoteText(quote)).toBe('Light\n\nis all');
		expect(quoteText({ type: 'quote' })).toBe('');
	});
});
