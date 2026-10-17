import { loadGlossaryMentions } from '#lib/glossary/glossary-mentions.ts';
import { loadGlossaryEntry } from '#lib/glossary/glossary-data.ts';
import type { GlossaryEntryResult } from '#lib/glossary/types.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }): Promise<GlossaryEntryResult> => {
	const result = await loadGlossaryEntry(params.id);
	if (!result.entry) return result;
	return { ...result, mentions: await loadGlossaryMentions(result.entry) };
};
