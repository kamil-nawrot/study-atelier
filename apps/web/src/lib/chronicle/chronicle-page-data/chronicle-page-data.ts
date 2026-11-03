import { loadVisit, loadVisits } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadNoteLinkLabels, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadArtworksById, loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import type { NoteLinks } from '@study-atelier/ui';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitResult } from '#lib/chronicle/types/visit-result.ts';

type ChronicleData = {
	visits: Visit[];
	artworks: WallArtwork[];
	error?: string;
};

type VisitPageData = VisitResult & {
	artworks: WallArtwork[];
	artworksError?: string;
	noteLinks?: NoteLinks;
	glossary?: GlossaryTerm[];
};

export async function loadChronicle(): Promise<ChronicleData> {
	const [chronicle, atelier] = await Promise.all([loadVisits(), loadAtelier()]);
	return {
		visits: chronicle.visits,
		artworks: atelier.artworks,
		error: chronicle.error ?? atelier.error
	};
}

export async function loadVisitPage(id: string): Promise<VisitPageData> {
	const result = await loadVisit(id);
	if (!result.visit) return { ...result, artworks: [] };
	const notes = result.visit.notes;
	const [atelier, noteLinks, glossary] = await Promise.all([
		result.visit.artworkIds.length > 0 ? loadArtworksById(result.visit.artworkIds) : undefined,
		mentionsLinks(notes) ? loadNoteLinkLabels({ visitId: id }) : undefined,
		notes ? loadTermIndex() : undefined
	]);
	return {
		...result,
		artworks: atelier?.artworks ?? [],
		artworksError: atelier?.error,
		noteLinks,
		glossary: glossary?.terms
	};
}
