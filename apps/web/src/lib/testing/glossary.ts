import type { GlossaryEntry, WikipediaArticle } from '#lib/glossary/types.ts';

export function testEntry(
	id: string,
	name: string,
	overrides: Partial<GlossaryEntry> = {}
): GlossaryEntry {
	return {
		id,
		name,
		category: 'architecture',
		definition: `${name} is a test definition. It has a second sentence.`,
		forms: [],
		source: null,
		...overrides
	};
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
