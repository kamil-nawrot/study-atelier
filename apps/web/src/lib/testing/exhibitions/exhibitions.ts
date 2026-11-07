import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

type Node = ExhibitionDocument;

export function text(value: string, marks: { type: string }[] = []): Node {
	return { type: 'text', text: value, ...(marks.length > 0 ? { marks } : {}) };
}

export function paragraph(value: string): Node {
	return value === '' ? { type: 'paragraph' } : { type: 'paragraph', content: [text(value)] };
}

export function textBlock(...values: string[]): Node {
	return { type: 'textBlock', content: values.map(paragraph) };
}

export function heading(value: string): Node {
	return {
		type: 'heading',
		attrs: { level: 2 },
		...(value === '' ? {} : { content: [text(value)] })
	};
}

export function artwork(artworkId: string): Node {
	return { type: 'artwork', attrs: { artworkId } };
}

export function closeUp(artworkId: string, x = 0.5, y = 0.5, viewWidth = 0.25): Node {
	return { type: 'closeUp', attrs: { artworkId, imageId: null, x, y, viewWidth } };
}

export function columns(...blocks: Node[]): Node {
	return {
		type: 'columns',
		content: blocks.map((block) => ({ type: 'column', content: [block] }))
	};
}

export function doc(...content: Node[]): ExhibitionDocument {
	return { type: 'doc', content };
}
