import { loadVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadNoteLinks, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const result = await loadVisit(params.id);
	if (!result.visit) return { ...result, artworks: [] };
	const notes = result.visit.notes;
	const [atelier, noteLinks, glossary] = await Promise.all([
		loadAtelier(),
		mentionsLinks(notes) ? loadNoteLinks() : undefined,
		notes ? loadGlossary() : undefined
	]);
	return {
		...result,
		artworks: atelier.artworks,
		artworksError: atelier.error,
		noteLinks,
		glossary: glossary?.entries
	};
};
