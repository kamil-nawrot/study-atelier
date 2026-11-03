import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NoteLinkOption } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';
import { editorNoteLinks, labelledNoteLinks, suggestionOption, withEras } from './note-links.ts';

const ermine: NoteLinkOption = {
	href: '/atelier/7',
	name: '#0007 Lady with an Ermine',
	detail: 'Leonardo da Vinci'
};

describe('suggestionOption', () => {
	it('shows an artwork by its record number and title, with its authors', () => {
		expect(
			suggestionOption({
				kind: 'artwork',
				id: 'a1',
				record_number: 7,
				title: 'Lady with an Ermine',
				authors: ['Leonardo da Vinci', 'Workshop'],
				parents: []
			})
		).toEqual({ ...ermine, detail: 'Leonardo da Vinci, Workshop' });
	});

	it('shows a value with its kind and parents, and eras by their names', () => {
		const option = suggestionOption({
			kind: 'period',
			id: 'p1',
			record_number: null,
			title: 'Baroque',
			authors: [],
			parents: ['early_modern']
		});
		expect(option).toEqual({
			href: '/atelier/values/period/p1',
			name: 'Baroque',
			detail: expect.stringContaining(m.eras.early_modern.name)
		});
	});

	it('skips a row of an unknown kind', () => {
		expect(
			suggestionOption({
				kind: 'unknown',
				id: 'x',
				record_number: null,
				title: 'X',
				authors: [],
				parents: []
			})
		).toBeUndefined();
	});
});

describe('withEras', () => {
	it('adds the eras whose names match, before the values that only contain the phrase', () => {
		const name = m.eras.early_modern.name;
		const inner = { href: '/atelier/values/style/s1', name: `Late ${name}`, detail: '' };
		const options = withEras(name, [inner]);
		expect(options[0]?.href).toBe('/atelier/values/era/early_modern');
		expect(options.at(-1)).toBe(inner);
	});

	it('limits the list', () => {
		const values = Array.from({ length: 10 }, (_, index) => ({
			href: `/atelier/values/author/a${index}`,
			name: `Author ${index}`,
			detail: ''
		}));
		expect(withEras('author', values)).toHaveLength(8);
	});
});

describe('editorNoteLinks', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('asks for two characters before searching', () => {
		const search = vi.fn();
		const links = editorNoteLinks(search);
		expect(links.minQueryLength).toBe(2);
		expect(links.suggest('#', ' e ')).toEqual([]);
		expect(search).not.toHaveBeenCalled();
	});

	it('searches after a pause in typing, only for the last phrase', async () => {
		const search = vi.fn(async () => [ermine]);
		const links = editorNoteLinks(search);

		const first = links.suggest('#', 'er');
		const last = links.suggest('#', 'ermi');
		await vi.advanceTimersByTimeAsync(150);

		await expect(first).resolves.toEqual([]);
		await expect(last).resolves.toEqual([ermine]);
		expect(search).toHaveBeenCalledExactlyOnceWith('#', 'ermi');
	});

	it('gives the labels of the note and of the inserted suggestions', async () => {
		const links = editorNoteLinks(
			vi.fn(async () => [ermine]),
			new Map([['/atelier/values/author/a1', 'Phidias']])
		);
		const suggested = links.suggest('#', 'ermine');
		await vi.advanceTimersByTimeAsync(150);
		await suggested;

		expect(links.resolve('/atelier/values/author/a1')).toBe('Phidias');
		expect(links.resolve('/atelier/0007')).toBe(ermine.name);
		expect(links.resolve('/atelier/99')).toBeUndefined();
	});
});

describe('labelledNoteLinks', () => {
	it('gives the labels and suggests nothing', () => {
		const links = labelledNoteLinks(new Map([['/atelier/12', '#0012 Calling of Saint Matthew']]));
		expect(links.resolve('/atelier/12')).toBe('#0012 Calling of Saint Matthew');
		expect(links.resolve('/atelier/values/author/gone')).toBeUndefined();
		expect(links.suggest('#', 'calling')).toEqual([]);
	});
});
