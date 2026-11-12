import { afterEach, describe, expect, it } from 'vitest';
import { choosePhoneColumns, phoneColumns } from './wall-columns.svelte.ts';

describe('wall columns', () => {
	afterEach(() => {
		choosePhoneColumns(2);
	});

	it('shows two columns on a phone by default', () => {
		expect(phoneColumns()).toBe(2);
		expect(localStorage.getItem('study-atelier:wall-columns')).toBeNull();
	});

	it('remembers one column on the device', () => {
		choosePhoneColumns(1);

		expect(phoneColumns()).toBe(1);
		expect(localStorage.getItem('study-atelier:wall-columns')).toBe('1');
	});
});
