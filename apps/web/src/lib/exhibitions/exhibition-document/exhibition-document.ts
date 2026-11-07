import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export const MAX_BLOCKS = 300;
export const MAX_ARTWORKS = 100;
export const MAX_DOCUMENT_BYTES = 524288;

const BLOCK_TYPES = new Set(['textBlock', 'heading', 'quote', 'artwork', 'closeUp']);

function walk(node: ExhibitionDocument, visit: (node: ExhibitionDocument) => void): void {
	visit(node);
	for (const child of node.content ?? []) walk(child, visit);
}

export function artworkIdsOf(document: ExhibitionDocument): string[] {
	const ids = new Set<string>();
	walk(document, (node) => {
		const id =
			node.type === 'artwork' || node.type === 'closeUp' ? node.attrs?.artworkId : undefined;
		if (typeof id === 'string') ids.add(id);
	});
	return [...ids];
}

export function blockCountOf(document: ExhibitionDocument): number {
	let count = 0;
	walk(document, (node) => {
		if (node.type && BLOCK_TYPES.has(node.type)) count += 1;
	});
	return count;
}

export function isBlankText(node: ExhibitionDocument): boolean {
	return node.type === 'textBlock' && (node.content ?? []).every((child) => !child.content?.length);
}

export function withEditableBody(document: ExhibitionDocument): ExhibitionDocument {
	const content = document.content ?? [];
	const last = content[content.length - 1];
	if (last && isBlankText(last)) return document;
	return {
		...document,
		content: [...content, { type: 'textBlock', content: [{ type: 'paragraph' }] }]
	};
}

export function documentBytes(document: ExhibitionDocument): number {
	return new TextEncoder().encode(JSON.stringify(document)).length;
}
