import { describe, expect, it } from 'vitest';
import {
	artworkIdsOf,
	blockCountOf,
	documentBytes,
	isBlankText,
	withEditableBody
} from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

const text = (value: string): ExhibitionDocument => ({
	type: 'textBlock',
	content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }]
});

const artwork = (artworkId: string): ExhibitionDocument => ({
	type: 'artwork',
	attrs: { artworkId }
});

describe('artworkIdsOf', () => {
	it('lists each artwork once in the order it first appears', () => {
		const document = {
			type: 'doc',
			content: [artwork('b'), text('x'), artwork('a'), artwork('b')]
		};
		expect(artworkIdsOf(document)).toEqual(['b', 'a']);
	});

	it('finds the artworks of close-ups and of blocks in a row', () => {
		const document = {
			type: 'doc',
			content: [
				{
					type: 'columns',
					content: [
						{ type: 'column', content: [artwork('a')] },
						{ type: 'column', content: [{ type: 'closeUp', attrs: { artworkId: 'b' } }] }
					]
				}
			]
		};
		expect(artworkIdsOf(document)).toEqual(['a', 'b']);
	});

	it('finds nothing in a document without artworks', () => {
		expect(artworkIdsOf({ type: 'doc', content: [text('x')] })).toEqual([]);
	});
});

describe('blockCountOf', () => {
	it('counts blocks of every kind and not the paragraphs inside them', () => {
		const document = {
			type: 'doc',
			content: [
				text('x'),
				{ type: 'heading', attrs: { level: 2 } },
				{ type: 'quote', content: [{ type: 'paragraph' }, { type: 'paragraph' }] },
				artwork('a'),
				{ type: 'term', attrs: { termId: 't' } },
				{ type: 'symbol', attrs: { symbolId: 's' } }
			]
		};
		expect(blockCountOf(document)).toBe(6);
	});

	it('counts the blocks of a row and the close-ups but not the row itself', () => {
		const document = {
			type: 'doc',
			content: [
				{
					type: 'columns',
					content: [
						{ type: 'column', content: [artwork('a')] },
						{ type: 'column', content: [{ type: 'closeUp', attrs: { artworkId: 'a' } }] }
					]
				}
			]
		};
		expect(blockCountOf(document)).toBe(2);
	});

	it('counts a heading inside a text as part of the text, like the database', () => {
		const document = {
			type: 'doc',
			content: [
				{
					type: 'textBlock',
					content: [{ type: 'heading', attrs: { level: 3 } }, { type: 'paragraph' }]
				},
				{ type: 'heading', attrs: { level: 2 } }
			]
		};
		expect(blockCountOf(document)).toBe(2);
	});
});

describe('isBlankText', () => {
	it('is true for a text block with no words in it', () => {
		expect(isBlankText({ type: 'textBlock', content: [{ type: 'paragraph' }] })).toBe(true);
	});

	it('is false once a paragraph has content', () => {
		expect(isBlankText(text('x'))).toBe(false);
	});

	it('is false for other kinds of blocks', () => {
		expect(isBlankText(artwork('a'))).toBe(false);
	});
});

describe('withEditableBody', () => {
	const blank = { type: 'textBlock', content: [{ type: 'paragraph' }] };

	it('gives an empty document one empty text block to write in', () => {
		expect(withEditableBody({ type: 'doc', content: [] }).content).toEqual([blank]);
	});

	it('adds an empty text block after a last block that is not one', () => {
		expect(withEditableBody({ type: 'doc', content: [artwork('a')] }).content).toEqual([
			artwork('a'),
			blank
		]);
	});

	it('keeps a document that already ends with an empty text block', () => {
		const document = { type: 'doc', content: [text('x'), blank] };
		expect(withEditableBody(document)).toBe(document);
	});
});

describe('documentBytes', () => {
	it('counts the bytes of the JSON, not its characters', () => {
		expect(documentBytes({ type: 'doc', attrs: { a: 'ł' } })).toBe(
			'{"type": "doc", "attrs": {"a": "ł"}}'.length + 1
		);
	});

	it('measures the text the database keeps, with spaces after separators and plain numbers', () => {
		const document = {
			type: 'doc',
			content: [{ type: 'closeUp', attrs: { x: 1e-7, y: 0.5, viewWidth: 1, imageId: undefined } }]
		};
		expect(documentBytes(document)).toBe(
			'{"type": "doc", "content": [{"type": "closeUp", "attrs": {"x": 0.0000001, "y": 0.5, "viewWidth": 1}}]}'
				.length
		);
		expect(documentBytes({ type: 'doc', attrs: { a: 2e21, b: -1.5e-8 } })).toBe(
			'{"type": "doc", "attrs": {"a": 2000000000000000000000, "b": -0.000000015}}'.length
		);
	});
});
