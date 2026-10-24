import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadGlossaryMentions } from '#lib/glossary/glossary-mentions/glossary-mentions.ts';
import { loadGlossary, loadGlossaryEntry } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryEntryResult } from '#lib/glossary/types/glossary-entry-result.ts';
import type { PinnedArtwork } from '#lib/glossary/types/pinned-artwork.ts';
import { loadEntryPins } from '#lib/pins/pin-data/pin-data.ts';
import type { PageLoad } from './$types';

async function loadPinned(entryId: string): Promise<{ pinned: PinnedArtwork[]; error?: string }> {
	const { pins, error } = await loadEntryPins(entryId);
	if (error) return { pinned: [], error };
	if (pins.length === 0) return { pinned: [] };
	const atelier = await loadAtelier();
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
	const result = await loadGlossaryEntry(params.id);
	if (!result.entry) return result;
	const [mentions, glossary, pinned] = await Promise.all([
		loadGlossaryMentions(result.entry),
		result.entry.definition ? loadGlossary() : undefined,
		loadPinned(result.entry.id)
	]);
	return {
		...result,
		mentions,
		glossary: glossary?.entries,
		pinned: pinned.pinned,
		pinnedError: pinned.error
	};
};
