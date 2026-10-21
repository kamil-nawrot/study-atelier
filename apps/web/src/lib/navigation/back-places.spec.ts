import { describe, expect, it } from 'vitest';
import {
	arrive,
	backPlace,
	emptyBackState,
	loadBackState,
	named,
	saveBackState,
	type BackState
} from './back-places.ts';

const glossary = { key: '/atelier/glossary', route: '/(app)/atelier/glossary' };
const entry = { key: '/atelier/glossary/a', route: '/(app)/atelier/glossary/[id]' };
const other = { key: '/atelier/glossary/b', route: '/(app)/atelier/glossary/[id]' };
const artwork = { key: '/atelier/7', route: '/(app)/atelier/[number]' };
const next = { key: '/atelier/8', route: '/(app)/atelier/[number]' };
const edit = { key: '/atelier/7/edit', route: '/(app)/atelier/[number]/edit' };

function withNames(): BackState {
	let state = emptyBackState();
	state = named(state, glossary.key, { name: 'Słowniczek', path: '/atelier/glossary' });
	state = named(state, entry.key, { name: 'Tympanon', path: entry.key });
	return named(state, artwork.key, { name: 'Straż nocna', path: artwork.key });
}

describe('arrive', () => {
	it('remembers the page the learner came from by its name', () => {
		const state = arrive(withNames(), { type: 'link', from: glossary, to: entry });
		expect(backPlace(state, entry.key)).toEqual({ name: 'Słowniczek', path: '/atelier/glossary' });
	});

	it('names another detail page by its thing', () => {
		let state = arrive(withNames(), { type: 'link', from: glossary, to: entry });
		state = arrive(state, { type: 'link', from: entry, to: artwork });
		expect(backPlace(state, artwork.key)?.name).toBe('Tympanon');
	});

	it('keeps the places when the learner goes back or forward', () => {
		let state = arrive(withNames(), { type: 'link', from: glossary, to: entry });
		state = arrive(state, { type: 'link', from: entry, to: artwork });
		const back = arrive(state, { type: 'popstate', from: artwork, to: entry });
		expect(backPlace(back, entry.key)?.name).toBe('Słowniczek');
	});

	it('forgets the place of a page opened directly', () => {
		let state = arrive(withNames(), { type: 'link', from: glossary, to: entry });
		state = arrive(state, { type: 'enter', from: null, to: entry });
		expect(backPlace(state, entry.key)).toBeUndefined();
	});

	it('carries the place over when the learner flips to the next artwork', () => {
		let state = arrive(withNames(), { type: 'link', from: entry, to: artwork });
		state = arrive(state, { type: 'link', from: artwork, to: next });
		expect(backPlace(state, next.key)?.name).toBe('Tympanon');
	});

	it('names the previous entry when one entry links to another', () => {
		let state = arrive(withNames(), { type: 'link', from: glossary, to: entry });
		state = arrive(state, { type: 'link', from: entry, to: other });
		expect(backPlace(state, other.key)?.name).toBe('Tympanon');
	});

	it('keeps the place of a page the learner returns to from its form', () => {
		let state = arrive(withNames(), { type: 'link', from: entry, to: artwork });
		state = arrive(state, { type: 'goto', from: edit, to: artwork });
		expect(backPlace(state, artwork.key)?.name).toBe('Tympanon');
	});

	it('forgets the place when the previous page has no name', () => {
		const state = arrive(emptyBackState(), { type: 'link', from: glossary, to: entry });
		expect(backPlace(state, entry.key)).toBeUndefined();
	});
});

describe('named', () => {
	it('returns the same state when nothing changes', () => {
		const state = withNames();
		expect(named(state, glossary.key, { name: 'Słowniczek', path: '/atelier/glossary' })).toBe(
			state
		);
	});
});

describe('loadBackState and saveBackState', () => {
	it('keeps the places for the tab and survives broken storage', () => {
		const items = new Map<string, string>();
		const storage = {
			getItem: (key: string) => items.get(key) ?? null,
			setItem: (key: string, value: string) => void items.set(key, value)
		};
		const state = arrive(withNames(), { type: 'link', from: glossary, to: entry });
		saveBackState(state, storage);
		expect(loadBackState(storage)).toEqual(state);
		expect(loadBackState({ getItem: () => '{broken' })).toEqual(emptyBackState());
		expect(() =>
			saveBackState(state, {
				setItem: () => {
					throw new Error('full');
				}
			})
		).not.toThrow();
	});
});
