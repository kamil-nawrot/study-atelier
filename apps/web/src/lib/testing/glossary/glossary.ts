import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { WikipediaArticle } from '#lib/glossary/types/wikipedia-article.ts';
import type { TermDefinitionResult } from '#lib/glossary/types/term-definition-result.ts';

export function testEntry(
	id: string,
	name: string,
	overrides: Partial<GlossaryEntry> = {}
): GlossaryEntry {
	const entry = {
		id,
		name,
		category: 'architecture' as const,
		definition: `${name} is a test definition. It has a second sentence.`,
		synonyms: [],
		forms: [],
		sortName: null,
		source: null,
		createdAt: '2026-10-17T10:00:00Z',
		...overrides
	};
	return { ...entry, hasDefinition: overrides.hasDefinition ?? entry.definition.trim() !== '' };
}

export function testArticle(
	title: string,
	extract = `${title} is a test article.`
): WikipediaArticle {
	return { title, url: `https://pl.wikipedia.org/wiki/${title}`, extract };
}

export function testGlossary(): GlossaryEntry[] {
	return [
		testEntry('a-tympanum', 'Tympanum', {
			synonyms: ['tympan'],
			forms: ['tympana', 'tympanum’s'],
			source: {
				title: 'Tympanum',
				url: 'https://pl.wikipedia.org/wiki/Tympanum',
				licence: 'CC BY-SA 4.0',
				fetchedOn: '2026-10-17'
			}
		}),
		testEntry('a-abacus', 'Abacus'),
		testEntry('a-fresco', 'Fresco', { category: 'technique' }),
		testEntry('a-chiaroscuro', 'Chiaroscuro', { category: 'painting' }),
		testEntry('a-lorenzo', 'Lorenzo Medici', { category: 'person' }),
		testEntry('a-lukowy', 'Łuk', { category: 'architecture' })
	];
}

export async function testTermDefinition(id: string): Promise<TermDefinitionResult> {
	const entry = testGlossary().find((candidate) => candidate.id === id);
	return entry ? { definition: entry.definition, source: entry.source } : { notFound: true };
}
