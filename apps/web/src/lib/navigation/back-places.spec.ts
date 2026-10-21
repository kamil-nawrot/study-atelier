import { describe, expect, it } from 'vitest';
import { arrive, loadNames, named, saveNames, type Names, type Place } from './back-places.ts';

const glossary = { key: '/atelier/glossary', route: '/(app)/atelier/glossary' };
const entry = { key: '/atelier/glossary/a', route: '/(app)/atelier/glossary/[id]' };
const other = { key: '/atelier/glossary/b', route: '/(app)/atelier/glossary/[id]' };
const artwork = { key: '/atelier/7', route: '/(app)/atelier/[number]' };
const next = { key: '/atelier/8', route: '/(app)/atelier/[number]' };
const edit = { key: '/atelier/7/edit', route: '/(app)/atelier/[number]/edit' };

const glossaryPlace = { name: 'Słowniczek', path: '/atelier/glossary' };
const entryPlace = { name: 'Tympanon', path: entry.key };
const artworkPlace = { name: 'Straż nocna', path: artwork.key };

function withNames(): Names {
	let names: Names = {};
	names = named(names, glossary.key, glossaryPlace);
	names = named(names, entry.key, entryPlace);
	return named(names, artwork.key, artworkPlace);
}

describe('arrive', () => {
	it('remembers the page the learner came from by its name', () => {
		expect(arrive(withNames(), undefined, { type: 'link', from: glossary, to: entry })).toEqual(
			glossaryPlace
		);
	});

	it('names another detail page by its thing', () => {
		const place = arrive(withNames(), glossaryPlace, { type: 'link', from: entry, to: artwork });
		expect(place?.name).toBe('Tympanon');
	});

	it('leaves the place of an entry the learner goes back or forward to to its snapshot', () => {
		const place = arrive(withNames(), entryPlace, { type: 'popstate', from: artwork, to: entry });
		expect(place).toBeUndefined();
	});

	it('forgets the place of a page opened directly', () => {
		expect(
			arrive(withNames(), entryPlace, { type: 'enter', from: null, to: entry })
		).toBeUndefined();
	});

	it('carries the place over when the learner flips to the next artwork', () => {
		const place = arrive(withNames(), entryPlace, { type: 'link', from: artwork, to: next });
		expect(place).toEqual(entryPlace);
	});

	it('names the previous entry when one entry links to another', () => {
		const place = arrive(withNames(), glossaryPlace, { type: 'link', from: entry, to: other });
		expect(place?.name).toBe('Tympanon');
	});

	it('gives a page back the place it had before the learner opened its form', () => {
		const names = withNames();
		const inForm = arrive(names, entryPlace, { type: 'link', from: artwork, to: edit });
		expect(inForm).toEqual({ ...artworkPlace, previous: entryPlace });
		expect(arrive(names, inForm, { type: 'goto', from: edit, to: artwork })).toEqual(entryPlace);
	});

	it('gives each visit to the same page its own place', () => {
		const names = withNames();
		const visits: (Place | undefined)[] = [];
		let place = arrive(names, undefined, { type: 'enter', from: null, to: artwork });
		visits.push(place);
		place = arrive(names, place, { type: 'link', from: artwork, to: entry });
		visits.push(place);
		place = arrive(names, place, { type: 'link', from: entry, to: artwork });
		visits.push(place);

		expect(visits).toEqual([undefined, artworkPlace, entryPlace]);
	});

	it('forgets the place when the previous page has no name', () => {
		expect(arrive({}, undefined, { type: 'link', from: glossary, to: entry })).toBeUndefined();
	});
});

describe('named', () => {
	it('returns the same names when nothing changes', () => {
		const names = withNames();
		expect(named(names, glossary.key, glossaryPlace)).toBe(names);
	});
});

describe('loadNames and saveNames', () => {
	it('keeps the names for the tab and survives broken storage', () => {
		const items = new Map<string, string>();
		const storage = {
			getItem: (key: string) => items.get(key) ?? null,
			setItem: (key: string, value: string) => void items.set(key, value)
		};
		saveNames(withNames(), storage);
		expect(loadNames(storage)).toEqual(withNames());
		expect(loadNames({ getItem: () => '{broken' })).toEqual({});
		expect(() =>
			saveNames(withNames(), {
				setItem: () => {
					throw new Error('full');
				}
			})
		).not.toThrow();
	});

	it('works when the browser blocks session storage', () => {
		const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
		Object.defineProperty(globalThis, 'sessionStorage', {
			configurable: true,
			get: () => {
				throw new Error('SecurityError');
			}
		});
		try {
			expect(loadNames()).toEqual({});
			expect(() => saveNames(withNames())).not.toThrow();
		} finally {
			if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
			else Reflect.deleteProperty(globalThis, 'sessionStorage');
		}
	});
});
