import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { deleteState, wallTexts } from './value-page-view.ts';

const city = { id: 'paris', category: 'location' as const, name: 'Paryż', count: 2 };

describe('deleteState', () => {
	it('names the artworks and places that keep a city', () => {
		expect(deleteState(city, [{ id: 'louvre', name: 'Luwr', count: 1 }])).toEqual({
			deletable: false,
			blocked: m.valuePage.cityDeleteBlocked(2, 1)
		});
		expect(m.valuePage.cityDeleteBlocked(2, 1)).toBe(
			'To miasto ma jeszcze 2 dzieła i 1 miejsce, więc nie da się go usunąć. Możesz je połączyć z innym miastem.'
		);
	});

	it('lets an unused value be deleted', () => {
		expect(deleteState({ ...city, count: 0 }, []).deletable).toBe(true);
		expect(deleteState(undefined, []).deletable).toBe(false);
	});
});

describe('wallTexts', () => {
	it('heads the wall of a city as the artworks of the city', () => {
		const subject = { kind: 'location' as const, record: city };
		expect(wallTexts(subject, true).artworks).toBe('Dzieła z tego miasta');
		expect(wallTexts(subject, false)).toBe(m.valuePage.kinds.location);
	});
});
