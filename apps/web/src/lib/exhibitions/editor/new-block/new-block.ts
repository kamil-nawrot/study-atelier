import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export type TextKind = 'textBlock' | 'heading' | 'quote' | 'divider';

export type ArtworkKind = 'artwork' | 'palette' | 'closeUp';

export type BlockKind = TextKind | ArtworkKind;

export type NewBlock = { kind: TextKind } | { kind: ArtworkKind; artworkId: string };

export type CloseUpAttributes = {
	artworkId: string;
	imageId: string | null;
	x: number;
	y: number;
	viewWidth: number;
};

export function kindOf(node: ExhibitionDocument): BlockKind {
	if (node.type === 'set') return kindOf(node.content?.[0] ?? { type: 'closeUp' });
	if (node.type === 'artwork' && node.attrs?.paletteOnly) return 'palette';
	return (node.type ?? 'textBlock') as BlockKind;
}

export function textNode(kind: TextKind): ExhibitionDocument {
	if (kind === 'heading') return { type: 'heading', attrs: { level: 2 } };
	if (kind === 'quote') return { type: 'quote', content: [{ type: 'paragraph' }] };
	if (kind === 'divider') return { type: 'divider' };
	return { type: 'textBlock', content: [{ type: 'paragraph' }] };
}

export function isSolo(node: ExhibitionDocument): boolean {
	return node.type === 'divider';
}

export function artworkNode(artworkId: string, paletteOnly = false): ExhibitionDocument {
	return paletteOnly
		? { type: 'artwork', attrs: { artworkId, paletteOnly: true } }
		: { type: 'artwork', attrs: { artworkId } };
}

export function closeUpNode(attributes: CloseUpAttributes): ExhibitionDocument {
	return { type: 'closeUp', attrs: { ...attributes } };
}

export function headingNode(value: string): ExhibitionDocument {
	return {
		type: 'heading',
		attrs: { level: 2 },
		...(value === '' ? {} : { content: [{ type: 'text', text: value }] })
	};
}

export function quoteNode(value: string): ExhibitionDocument {
	return {
		type: 'quote',
		content: value
			.split('\n')
			.map((line) =>
				line === ''
					? { type: 'paragraph' }
					: { type: 'paragraph', content: [{ type: 'text', text: line }] }
			)
	};
}

export function quoteText(node: ExhibitionDocument): string {
	return (node.content ?? [])
		.map((paragraph) => (paragraph.content ?? []).map((child) => child.text ?? '').join(''))
		.join('\n');
}

export function headingText(node: ExhibitionDocument): string {
	return (node.content ?? []).map((child) => child.text ?? '').join('');
}
