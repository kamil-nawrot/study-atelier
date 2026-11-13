import { loadArtworksOfTerm } from '#lib/wall/wall-data/wall-data.ts';
import { loadGlossaryMentions } from '#lib/glossary/glossary-mentions/glossary-mentions.ts';
import { loadGlossaryEntry, loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import type { GlossaryEntryResult } from '#lib/glossary/types/glossary-entry-result.ts';
import type { PinnedArtwork } from '#lib/glossary/types/pinned-artwork.ts';
import type { TermFragment } from '#lib/glossary/types/term-fragment.ts';
import { termFragments } from '#lib/glossary/term-fragments/term-fragments.ts';
import { loadSymbolUses } from '#lib/symbols/symbol-uses-data/symbol-uses-data.ts';
import { loadEntryPins } from '#lib/pins/pin-data/pin-data.ts';
import type { PageLoad } from './$types';

type Pinned = { pinned: PinnedArtwork[]; fragments: TermFragment[]; error?: string };

async function loadPinned(entryId: string): Promise<Pinned> {
	const [{ pins, fragments, error }, atelier] = await Promise.all([
		loadEntryPins(entryId),
		loadArtworksOfTerm(entryId)
	]);
	if (error) return { pinned: [], fragments: [], error };
	if (atelier.error) return { pinned: [], fragments: [], error: atelier.error };
	const pinIds = new Map(pins.map((pin) => [pin.artworkId, pin.pinId]));
	return {
		fragments: await termFragments(fragments, atelier.artworks),
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
	const [mentions, glossary, pinned, uses] = await Promise.all([
		loadGlossaryMentions(result.entry),
		result.entry.definition ? loadTermIndex() : undefined,
		pinnedLoad,
		loadSymbolUses({ glossaryEntryId: params.id })
	]);
	return {
		...result,
		mentions,
		glossary: glossary?.terms,
		pinned: pinned.pinned,
		fragments: pinned.fragments,
		pinnedError: pinned.error,
		symbolUses: uses.error ? undefined : uses.uses
	};
};
