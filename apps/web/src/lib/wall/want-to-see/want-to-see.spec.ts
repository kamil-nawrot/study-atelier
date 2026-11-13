import { describe, expect, it } from 'vitest';
import { wantToSeeLabel, wantToSeeToast } from './want-to-see.ts';

describe('want to see', () => {
	it('names the action by the current state', () => {
		expect(wantToSeeLabel(false)).toBe('Chcę zobaczyć na żywo');
		expect(wantToSeeLabel(true)).toBe('Usuń z „Chcę zobaczyć”');
		expect(wantToSeeToast(true)).toBe('Dodano do dzieł, które chcesz zobaczyć.');
		expect(wantToSeeToast(false)).toBe('Usunięto z dzieł, które chcesz zobaczyć.');
	});
});
