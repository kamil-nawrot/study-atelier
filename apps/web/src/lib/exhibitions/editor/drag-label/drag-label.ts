import type { Node as ProseNode } from '@tiptap/pm/model';
import { m } from '#lib/i18n/i18n.ts';
import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import type { NewBlock } from '#lib/exhibitions/editor/block-commands/block-commands.ts';

export const LABEL_LENGTH = 40;

const KIND_LABELS: Record<string, string> = {
	textBlock: m.exhibitions.bar.paragraph,
	heading: m.exhibitions.bar.heading,
	quote: m.exhibitions.bar.quote
};

function shortened(text: string): string {
	const trimmed = text.trim().replace(/\s+/g, ' ');
	return trimmed.length > LABEL_LENGTH ? `${trimmed.slice(0, LABEL_LENGTH - 1)}…` : trimmed;
}

function titleOf(lookup: ArtworkLookup, artworkId: unknown): string {
	return lookup.get(String(artworkId))?.title ?? m.exhibitions.bar.move;
}

export function blockLabel(node: ProseNode, lookup: ArtworkLookup): string {
	const name = node.type.name;
	if (name === 'artwork') return titleOf(lookup, node.attrs.artworkId);
	if (name === 'closeUp') return m.exhibitions.closeUp.label(titleOf(lookup, node.attrs.artworkId));
	return shortened(node.textContent) || (KIND_LABELS[name] ?? m.exhibitions.bar.move);
}

export function newBlockLabel(block: NewBlock, lookup: ArtworkLookup): string {
	return block.kind === 'artwork'
		? titleOf(lookup, block.artworkId)
		: (KIND_LABELS[block.kind] ?? m.exhibitions.bar.move);
}
