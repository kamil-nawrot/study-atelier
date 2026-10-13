import { describe, expect, it } from 'vitest';
import data from './auth-artworks.json';

const publicDomain = ['Public domain', 'CC0'];

describe('auth-artworks.json', () => {
	it('lists around one hundred works', () => {
		expect(data.length).toBeGreaterThanOrEqual(95);
	});

	it('has unique Wikidata ids and Commons files', () => {
		expect(new Set(data.map((entry) => entry.id)).size).toBe(data.length);
		expect(new Set(data.map((entry) => entry.file)).size).toBe(data.length);
	});

	it('gives every entry a title, a year, a kind and a Commons image file', () => {
		for (const entry of data) {
			expect(entry.id).toMatch(/^Q\d+$/);
			expect(entry.title.length).toBeGreaterThan(0);
			expect(Number.isInteger(entry.year)).toBe(true);
			expect(['painting', 'sculpture', 'architecture', 'drawing']).toContain(entry.kind);
			expect(entry.file).toMatch(/\.(jpe?g|png|tiff?)$/i);
			expect(entry.file).not.toContain(' ');
		}
	});

	it('names the photographer wherever the image is not public domain', () => {
		for (const entry of data) {
			if (!publicDomain.includes(entry.license)) {
				expect(entry).toHaveProperty('photographer');
			}
		}
	});

	it('covers more than paintings', () => {
		const kinds = new Set(data.map((entry) => entry.kind));
		expect(kinds.has('sculpture')).toBe(true);
		expect(kinds.has('architecture')).toBe(true);
	});
});
