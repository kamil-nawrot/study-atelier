import { describe, expect, it } from 'vitest';
import { favouriteLabel, favouriteToast } from './favourite.ts';

describe('favourite', () => {
	it('names the action by the current state', () => {
		expect(favouriteLabel(false)).toBe('Dodaj do ulubionych');
		expect(favouriteLabel(true)).toBe('Usuń z ulubionych');
		expect(favouriteToast(true)).toBe('Dodano do ulubionych.');
		expect(favouriteToast(false)).toBe('Usunięto z ulubionych.');
	});
});
