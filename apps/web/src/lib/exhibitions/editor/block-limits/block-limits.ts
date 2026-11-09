import {
	MAX_ARTWORKS,
	MAX_BLOCKS,
	MAX_DOCUMENT_BYTES,
	artworkIdsOf,
	blockCountOf,
	documentBytes
} from '#lib/exhibitions/exhibition-document/exhibition-document.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export function sizeLimitOf(document: ExhibitionDocument): string | undefined {
	return documentBytes(document) > MAX_DOCUMENT_BYTES ? m.exhibitions.errors.tooBig : undefined;
}

export function limitOf(document: ExhibitionDocument): string | undefined {
	if (blockCountOf(document) > MAX_BLOCKS) return m.exhibitions.limits.blocks;
	if (artworkIdsOf(document).length > MAX_ARTWORKS) return m.exhibitions.limits.artworks;
	return sizeLimitOf(document);
}
