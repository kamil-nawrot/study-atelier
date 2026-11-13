import { loadVisitPlaces } from '#lib/card-index/category-values-data/category-values-data.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { loadTrips, loadVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { locale } from '#lib/i18n/i18n.ts';
import { loadEditorNoteLinks, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadTowns } from '#lib/map/geography/geography.ts';
import { loadMapPlaces } from '#lib/map/places-data/places-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import type { Town } from '#lib/map/types/town.ts';
import type { VisitFormData } from '#lib/chronicle/types/visit-form-data.ts';
import type { VisitResult } from '#lib/chronicle/types/visit-result.ts';

export async function loadVisitForm(id?: string): Promise<VisitFormData> {
	const visit = id ? loadVisit(id) : Promise.resolve<VisitResult>({});
	const [result, noteLinks, atelier, visitPlaces, placeStarter, mapPlaces, towns, trips] =
		await Promise.all([
			visit,
			visit.then((loaded) =>
				loadEditorNoteLinks(id && mentionsLinks(loaded.visit?.notes) ? { visitId: id } : undefined)
			),
			loadAtelier(),
			loadVisitPlaces(),
			loadPlaceStarter(),
			loadMapPlaces(),
			loadTowns().catch((): Town[] => []),
			loadTrips()
		]);
	const places = new Set([
		...visitPlaces.places,
		...atelier.artworks.flatMap((artwork) => artwork.location ?? [])
	]);
	return {
		...result,
		error: result.error ?? atelier.error ?? trips.error,
		artworks: atelier.artworks,
		places: [...places].sort((a, b) => a.localeCompare(b, locale)),
		tripPlaces: mapPlaces.places.map(({ id, name, placeType, countryCode, point, cityId }) => ({
			id,
			name,
			placeType,
			countryCode,
			point,
			cityId
		})),
		towns,
		trips: trips.visits.filter((trip) => trip.id !== id),
		placeStarter,
		noteLinks
	};
}
