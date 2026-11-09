import { m } from '#lib/i18n/i18n.ts';
import { kindOf, type NewBlock } from '#lib/exhibitions/editor/new-block/new-block.ts';
import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export function newBlockLabel(block: NewBlock, lookup: ArtworkLookup): string {
	const kind = m.exhibitions.blocks[block.kind];
	if ('termId' in block) return `${kind}: ${block.name}`;
	if (!('artworkId' in block)) return kind;
	const title = lookup.get(block.artworkId)?.title;
	return title ? `${kind}: ${title}` : kind;
}

export function blockLabel(node: ExhibitionDocument, lookup: ArtworkLookup): string {
	const kind = kindOf(node);
	const artworkId = node.attrs?.artworkId;
	return typeof artworkId === 'string'
		? newBlockLabel({ kind: kind as 'artwork', artworkId }, lookup)
		: m.exhibitions.blocks[kind];
}
