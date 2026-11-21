import { loadBrokenImages, loadFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import type { BackroomTerm } from '#lib/backroom/types/backroom-term.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [flags, atelier, index, brokenImages] = await Promise.all([
		loadFlags(),
		loadAtelier(),
		loadTermIndex(),
		loadBrokenImages()
	]);
	const terms: BackroomTerm[] = index.terms.map(({ id, name, hasDefinition }) => ({
		id,
		name,
		hasDefinition
	}));
	return {
		flags: flags.flags,
		artworks: atelier.artworks,
		terms,
		brokenImages,
		error: flags.error ?? atelier.error ?? index.error
	};
};
