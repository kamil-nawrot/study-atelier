import { Node } from '@tiptap/core';

export const ExhibitionDoc = Node.create({
	name: 'doc',
	topNode: true,
	content: '(textBlock | heading | quote | artwork | closeUp | columns)+'
});

export const TextBlock = Node.create({
	name: 'textBlock',
	content: '(paragraph | bulletList | orderedList)+',
	isolating: true,
	defining: true,
	parseHTML: () => [{ tag: 'div[data-block="text"]' }],
	renderHTML: () => ['div', { 'data-block': 'text' }, 0]
});

export const ExhibitionHeading = Node.create({
	name: 'heading',
	content: 'text*',
	marks: 'italic',
	isolating: true,
	defining: true,
	addAttributes: () => ({ level: { default: 2, rendered: false } }),
	parseHTML: () => [{ tag: 'h2' }],
	renderHTML: () => ['h2', 0]
});

export const Quote = Node.create({
	name: 'quote',
	content: 'paragraph+',
	isolating: true,
	defining: true,
	parseHTML: () => [{ tag: 'blockquote' }],
	renderHTML: () => ['blockquote', 0]
});

export const Columns = Node.create({
	name: 'columns',
	content: 'column+',
	isolating: true,
	defining: true,
	selectable: false,
	parseHTML: () => [{ tag: 'div[data-block="columns"]' }],
	renderHTML: () => ['div', { 'data-block': 'columns' }, 0]
});

export const Column = Node.create({
	name: 'column',
	content: '(textBlock | heading | quote | artwork | closeUp)',
	isolating: true,
	defining: true,
	selectable: false,
	parseHTML: () => [{ tag: 'div[data-column]' }],
	renderHTML: () => ['div', { 'data-column': '' }, 0]
});
