import { loadCategoryValues } from '#lib/card-index/category-values-data/category-values-data.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { loadVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import type { NoteLinks } from '@study-atelier/ui';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import type { VisitResult } from '#lib/chronicle/types/visit-result.ts';

type VisitFormData = VisitResult & {
	artworks: WallArtwork[];
	places: string[];
	placeStarter: PlaceStarter;
	noteLinks?: NoteLinks;
};

export async function loadVisitForm(id?: string): Promise<VisitFormData> {
	const [result, atelier, categories, placeStarter, noteLinks] = await Promise.all([
		id ? loadVisit(id) : Promise.resolve<VisitResult>({}),
		loadAtelier(),
		loadCategoryValues(),
		loadPlaceStarter(),
		loadNoteLinks()
	]);
	return {
		...result,
		error: result.error ?? atelier.error,
		artworks: atelier.artworks,
		places: categories.values.location,
		placeStarter,
		noteLinks
	};
}
