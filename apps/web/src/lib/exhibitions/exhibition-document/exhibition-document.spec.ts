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
				artwork('a')
			]
		};
		expect(blockCountOf(document)).toBe(4);
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
		expect(documentBytes({ type: 'doc', content: [text('ł')] })).toBe(
			JSON.stringify({ type: 'doc', content: [text('ł')] }).length + 1
		);
	});
});
