import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadSymbolAtlas } from '#lib/symbols/symbols-data/symbols-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [glossary, atlas] = await Promise.all([loadGlossary(), loadSymbolAtlas()]);
	return { ...glossary, symbols: atlas.symbols, symbolsError: atlas.error };
};
