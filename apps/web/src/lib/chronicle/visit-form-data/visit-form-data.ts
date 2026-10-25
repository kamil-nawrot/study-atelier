import { loadVisitPlaces } from '#lib/card-index/category-values-data/category-values-data.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { loadVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { locale } from '#lib/i18n/i18n.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import type { VisitFormData } from '#lib/chronicle/types/visit-form-data.ts';
import type { VisitResult } from '#lib/chronicle/types/visit-result.ts';

export async function loadVisitForm(id?: string): Promise<VisitFormData> {
	const [result, atelier, visitPlaces, placeStarter, noteLinks] = await Promise.all([
		id ? loadVisit(id) : Promise.resolve<VisitResult>({}),
		loadAtelier(),
		loadVisitPlaces(),
		loadPlaceStarter(),
		loadNoteLinks()
	]);
	const places = new Set([
		...visitPlaces.places,
		...atelier.artworks.flatMap((artwork) => artwork.location ?? [])
	]);
	return {
		...result,
		error: result.error ?? atelier.error,
		artworks: atelier.artworks,
		places: [...places].sort((a, b) => a.localeCompare(b, locale)),
		placeStarter,
		noteLinks
	};
}
