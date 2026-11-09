import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export const MAX_SET_ITEMS = 5;

const PLACEMENT = ['align', 'valign'];

function split(node: ExhibitionDocument): {
	item: ExhibitionDocument;
	place: Record<string, unknown>;
} {
	const attrs: Record<string, unknown> = { ...node.attrs };
	const place: Record<string, unknown> = {};
	for (const key of PLACEMENT) {
		if (key in attrs) place[key] = attrs[key];
		delete attrs[key];
	}
	return { item: { ...node, attrs }, place };
}

export function itemsOf(node: ExhibitionDocument): ExhibitionDocument[] {
	return node.type === 'set' ? (node.content ?? []) : [node];
}

export function canGrow(node: ExhibitionDocument): boolean {
	return itemsOf(node).length < MAX_SET_ITEMS;
}

export function withItem(node: ExhibitionDocument, item: ExhibitionDocument): ExhibitionDocument {
	if (!canGrow(node)) return node;
	const added = split(item).item;
	if (node.type === 'set') return { ...node, content: [...(node.content ?? []), added] };
	const { item: first, place } = split(node);
	return {
		type: 'set',
		...(Object.keys(place).length > 0 ? { attrs: place } : {}),
		content: [first, added]
	};
}

export function withoutItem(node: ExhibitionDocument, index: number): ExhibitionDocument {
	const items = itemsOf(node).filter((_, at) => at !== index);
	if (node.type !== 'set' || items.length === 0) return node;
	if (items.length > 1) return { ...node, content: items };
	const attrs = { ...items[0].attrs, ...node.attrs };
	return { ...items[0], attrs };
}
