import { loadGlossaryMentions } from '#lib/glossary/glossary-mentions.ts';
import { loadGlossary, loadGlossaryEntry } from '#lib/glossary/glossary-data.ts';
import type { GlossaryEntryResult } from '#lib/glossary/types.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<GlossaryEntryResult> => {
	const result = await loadGlossaryEntry(params.id);
	if (!result.entry) return result;
	const [mentions, glossary] = await Promise.all([
		loadGlossaryMentions(result.entry),
		result.entry.definition ? loadGlossary() : undefined
	]);
	return { ...result, mentions, glossary: glossary?.entries };
};
