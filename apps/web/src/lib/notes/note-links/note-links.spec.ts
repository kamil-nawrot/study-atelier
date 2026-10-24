import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { buildNoteLinks } from './note-links.ts';

const links = buildNoteLinks({
	index: testCardIndex(),
	artworks: [
		{ number: 7, title: 'Lady with an Ermine', authors: ['Leonardo da Vinci'] },
		{ number: 12, title: 'Calling of Saint Matthew', authors: ['Caravaggio'] },
		{ number: 120, title: 'Untitled', authors: [] }
	]
});

describe('suggesting values', () => {
	it('asks for two characters before listing', () => {
		expect(links.minQueryLength).toBe(2);
	});

	it('lists values of every kind with their kind and parents', () => {
		const options = links.suggest('@', 'dor');
		expect(options).toEqual([
			{
				href: '/atelier/values/style/style-doric',
				name: 'Doric',
				detail: expect.stringContaining('Classical')
			}
		]);
	});

	it('offers the eras by their names', () => {
		const name = m.eras.early_modern.name;
		const options = links.suggest('@', name.slice(0, 4));
		expect(options.map((option) => option.href)).toContain('/atelier/values/era/early_modern');
	});

	it('ignores case and diacritics', () => {
		expect(links.suggest('@', 'PHIDIAS').map((option) => option.name)).toEqual(['Phidias']);
	});

	it('finds nothing for an unknown name', () => {
		expect(links.suggest('@', 'zzz')).toEqual([]);
	});

	it('limits the list', () => {
		expect(links.suggest('@', '').length).toBeLessThanOrEqual(8);
	});
});

describe('suggesting artworks', () => {
	it('finds an artwork by title and shows its authors', () => {
		expect(links.suggest('#', 'ermine')).toEqual([
			{ href: '/atelier/7', name: '#0007 Lady with an Ermine', detail: 'Leonardo da Vinci' }
		]);
	});

	it('finds an artwork by author', () => {
		expect(links.suggest('#', 'caravaggio').map((option) => option.href)).toEqual(['/atelier/12']);
	});

	it('finds artworks by the start of their record number, lowest first', () => {
		expect(links.suggest('#', '12').map((option) => option.href)).toEqual([
			'/atelier/12',
			'/atelier/120'
		]);
	});

	it('finds nothing for an unknown title', () => {
		expect(links.suggest('#', 'zzz')).toEqual([]);
	});
});

describe('resolving addresses', () => {
	it('gives the current name of a value', () => {
		expect(links.resolve('/atelier/values/author/author-phidias')).toBe('Phidias');
		expect(links.resolve('/atelier/values/era/early_modern')).toBe(m.eras.early_modern.name);
	});

	it('gives the record number and title of an artwork', () => {
		expect(links.resolve('/atelier/12')).toBe('#0012 Calling of Saint Matthew');
	});

	it('gives nothing for a missing value or artwork', () => {
		expect(links.resolve('/atelier/values/author/gone')).toBeUndefined();
		expect(links.resolve('/atelier/values/style/author-phidias')).toBeUndefined();
		expect(links.resolve('/atelier/values/era/unknown')).toBeUndefined();
		expect(links.resolve('/atelier/99')).toBeUndefined();
	});
});
