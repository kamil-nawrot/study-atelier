import { loadArtworksOfTerm } from '#lib/wall/wall-data/wall-data.ts';
import { loadGlossaryMentions } from '#lib/glossary/glossary-mentions/glossary-mentions.ts';
import { loadGlossaryEntry, loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryEntryResult } from '#lib/glossary/types/glossary-entry-result.ts';
import type { PinnedArtwork } from '#lib/glossary/types/pinned-artwork.ts';
import { loadEntryPins } from '#lib/pins/pin-data/pin-data.ts';
import type { PageLoad } from './$types';

async function loadPinned(entryId: string): Promise<{ pinned: PinnedArtwork[]; error?: string }> {
	const [{ pins, error }, atelier] = await Promise.all([
		loadEntryPins(entryId),
		loadArtworksOfTerm(entryId)
	]);
	if (error) return { pinned: [], error };
	if (atelier.error) return { pinned: [], error: atelier.error };
	const pinIds = new Map(pins.map((pin) => [pin.artworkId, pin.pinId]));
	return {
		pinned: atelier.artworks.flatMap((artwork) => {
			const pinId = pinIds.get(artwork.id);
			return pinId ? [{ artwork, pinId }] : [];
		})
	};
}

export const load: PageLoad = async ({ params }): Promise<GlossaryEntryResult> => {
	const pinnedLoad = loadPinned(params.id);
	const result = await loadGlossaryEntry(params.id);
	if (!result.entry) return result;
	const [mentions, glossary, pinned] = await Promise.all([
		loadGlossaryMentions(result.entry),
		result.entry.definition ? loadTermIndex() : undefined,
		pinnedLoad
	]);
	return {
		...result,
		mentions,
		glossary: glossary?.terms,
		pinned: pinned.pinned,
		pinnedError: pinned.error
	};
};
