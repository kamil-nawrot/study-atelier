import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export const MAX_BLOCKS = 300;
export const MAX_ARTWORKS = 100;
export const MAX_DOCUMENT_BYTES = 524288;

const BLOCK_TYPES = new Set([
	'textBlock',
	'heading',
	'quote',
	'artwork',
	'closeUp',
	'divider',
	'term'
]);

function walk(
	node: ExhibitionDocument,
	visit: (node: ExhibitionDocument, parent?: ExhibitionDocument) => void,
	parent?: ExhibitionDocument
): void {
	visit(node, parent);
	for (const child of node.content ?? []) walk(child, visit, node);
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
	walk(document, (node, parent) => {
		if (node.type === 'heading' && parent?.type === 'textBlock') return;
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

function numberText(value: number): string {
	if (!Number.isFinite(value)) return 'null';
	const text = String(value);
	const match = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
	if (!match) return text;
	const [, sign, lead, rest = '', power] = match;
	const digits = `${lead}${rest}`;
	const point = 1 + Number(power);
	if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`;
	return `${sign}${digits.padEnd(point, '0')}`;
}

function jsonbText(value: unknown): string {
	if (typeof value === 'number') return numberText(value);
	if (Array.isArray(value)) {
		return `[${value.map((item) => (item === undefined ? 'null' : jsonbText(item))).join(', ')}]`;
	}
	if (value !== null && typeof value === 'object') {
		const entries = Object.entries(value).filter(([, item]) => item !== undefined);
		return `{${entries.map(([key, item]) => `${JSON.stringify(key)}: ${jsonbText(item)}`).join(', ')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}

export function documentBytes(document: ExhibitionDocument): number {
	return new TextEncoder().encode(jsonbText(document)).length;
}
