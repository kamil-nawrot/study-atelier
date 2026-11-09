import { describe, expect, it } from 'vitest';
import {
	plainText,
	textBlockMarkdown
} from '#lib/exhibitions/exhibition-markdown/exhibition-markdown.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

const words = (text: string, ...marks: string[]): ExhibitionDocument => ({
	type: 'text',
	text,
	...(marks.length > 0 ? { marks: marks.map((type) => ({ type })) } : {})
});

const paragraph = (...content: ExhibitionDocument[]): ExhibitionDocument => ({
	type: 'paragraph',
	content
});

const item = (text: string, ...nested: ExhibitionDocument[]): ExhibitionDocument => ({
	type: 'listItem',
	content: [paragraph(words(text)), ...nested]
});

describe('textBlockMarkdown', () => {
	it('writes bold and italic words as Markdown', () => {
		const block = {
			type: 'textBlock',
			content: [paragraph(words('a '), words('b', 'bold'), words(' c', 'italic'))]
		};
		expect(textBlockMarkdown(block)).toBe('a **b** *c*');
	});

	it('keeps the spaces outside the marks', () => {
		const block = { type: 'textBlock', content: [paragraph(words('b ', 'bold'), words('c'))] };
		expect(textBlockMarkdown(block)).toBe('**b** c');
	});

	it('nests bold and italic on the same words', () => {
		const block = { type: 'textBlock', content: [paragraph(words('b', 'bold', 'italic'))] };
		expect(textBlockMarkdown(block)).toBe('***b***');
	});

	it('writes a heading of a text as a Markdown heading', () => {
		const block = {
			type: 'textBlock',
			content: [
				{ type: 'heading', attrs: { level: 3 }, content: [words('Light', 'bold')] },
				paragraph(words('a'))
			]
		};
		expect(textBlockMarkdown(block)).toBe('### **Light**\n\na');
	});

	it('separates paragraphs with a blank line', () => {
		const block = { type: 'textBlock', content: [paragraph(words('a')), paragraph(words('b'))] };
		expect(textBlockMarkdown(block)).toBe('a\n\nb');
	});

	it('escapes characters that Markdown would read as formatting or links', () => {
		const block = { type: 'textBlock', content: [paragraph(words('[a](/atelier/1) *b* _c_'))] };
		expect(textBlockMarkdown(block)).toBe('\\[a\\](/atelier/1) \\*b\\* \\_c\\_');
	});

	it('escapes a line that would start a heading or a list', () => {
		const block = {
			type: 'textBlock',
			content: [paragraph(words('# a')), paragraph(words('1. b'))]
		};
		expect(textBlockMarkdown(block)).toBe('\\# a\n\n\\1. b');
	});

	it('writes bullet and numbered lists with nested lists indented', () => {
		const block = {
			type: 'textBlock',
			content: [
				{
					type: 'orderedList',
					content: [item('a', { type: 'bulletList', content: [item('b')] }), item('c')]
				}
			]
		};
		expect(textBlockMarkdown(block)).toBe('1. a\n   - b\n2. c');
	});

	it('indents a list nested in the tenth numbered item to the column of its words', () => {
		const items = Array.from({ length: 10 }, (_, index) => item(`i${index + 1}`));
		items[9] = item('i10', { type: 'orderedList', content: [item('x'), item('y')] });
		const block = { type: 'textBlock', content: [{ type: 'orderedList', content: items }] };

		expect(textBlockMarkdown(block).split('\n').slice(-3)).toEqual([
			'10. i10',
			'    1. x',
			'    2. y'
		]);
	});

	it('writes every paragraph of a list item inside the item', () => {
		const block = {
			type: 'textBlock',
			content: [
				{
					type: 'orderedList',
					content: [
						{
							type: 'listItem',
							content: [
								paragraph(words('a')),
								{ type: 'bulletList', content: [item('b')] },
								paragraph(words('c'))
							]
						},
						item('d')
					]
				}
			]
		};

		expect(textBlockMarkdown(block)).toBe('1. a\n   - b\n\n   c\n2. d');
	});
});

describe('plainText', () => {
	it('joins the words of a heading', () => {
		expect(plainText({ type: 'heading', content: [words('a'), words('b', 'bold')] })).toBe('ab');
	});

	it('puts the paragraphs of a quote on separate lines', () => {
		expect(
			plainText({ type: 'quote', content: [paragraph(words('a')), paragraph(words('b'))] })
		).toBe('a\nb');
	});

	it('leaves out empty text, and writes words made only of spaces without marks', () => {
		const block = {
			type: 'textBlock',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: '' },
						{ type: 'text', text: ' ', marks: [{ type: 'bold' }] },
						{ type: 'text' }
					]
				}
			]
		};

		expect(textBlockMarkdown(block)).toBe(' ');
	});

	it('writes an empty list item and a block without content', () => {
		const block = {
			type: 'textBlock',
			content: [{ type: 'bulletList', content: [{ type: 'listItem' }] }, { type: 'paragraph' }]
		};

		expect(textBlockMarkdown(block)).toBe('- \n\n');
		expect(textBlockMarkdown({ type: 'textBlock' })).toBe('');
		expect(plainText({ type: 'heading' })).toBe('');
		expect(plainText({ type: 'text' })).toBe('');
	});
});
