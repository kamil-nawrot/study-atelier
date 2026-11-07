import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export const ALIGNS = ['left', 'center', 'right'] as const;

export const VALIGNS = ['top', 'middle', 'bottom'] as const;

export type Align = (typeof ALIGNS)[number];

export type Valign = (typeof VALIGNS)[number];

export type Position = { align: Align; valign: Valign };

function pick<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
	return values.find((known) => known === value) ?? fallback;
}

export function positionOf(node: ExhibitionDocument | undefined): Position {
	return {
		align: pick(node?.attrs?.align, ALIGNS, 'left'),
		valign: pick(node?.attrs?.valign, VALIGNS, 'top')
	};
}

export function placed(node: ExhibitionDocument, position: Position): ExhibitionDocument {
	const attrs: Record<string, unknown> = { ...node.attrs };
	delete attrs.align;
	delete attrs.valign;
	if (position.align !== 'left') attrs.align = position.align;
	if (position.valign !== 'top') attrs.valign = position.valign;
	return { ...node, attrs };
}
