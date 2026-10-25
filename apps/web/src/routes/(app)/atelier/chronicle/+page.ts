import { loadVisits } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [chronicle, atelier] = await Promise.all([loadVisits(), loadAtelier()]);
	return {
		visits: chronicle.visits,
		artworks: atelier.artworks,
		error: chronicle.error ?? atelier.error
	};
};
