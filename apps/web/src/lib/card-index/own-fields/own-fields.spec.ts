import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import { fieldNameError, planOwnValueChange } from './own-fields.ts';

describe('fieldNameError', () => {
	const fields = testOwnFields();

	it('asks for a name', () => {
		expect(fieldNameError('   ', fields)).toBe(m.ownFields.errors.nameRequired);
	});

	it('refuses the label of a built-in field in any letter case', () => {
		expect(fieldNameError('styl', fields)).toBe(
			m.ownFields.errors.builtInName(m.artworkForm.style)
		);
	});

	it('accepts a form of a built-in label that is not the label itself', () => {
		expect(fieldNameError('Autor', fields)).toBeUndefined();
	});

	it('refuses the name of another own field in any letter case', () => {
		expect(fieldNameError(' lecture ', fields)).toBe(m.ownFields.errors.ownName('Lecture'));
	});

	it('lets a field keep its own name', () => {
		expect(fieldNameError('LECTURE', fields, 'lecture')).toBeUndefined();
	});
});

describe('planOwnValueChange', () => {
	const motifs = testOwnFields()[1];
	const angle = motifs.values[1];

	it('merges a value renamed to another value of the field', () => {
		expect(planOwnValueChange(angle, ' angel ', motifs)).toEqual({
			kind: 'merge',
			target: motifs.values[0]
		});
	});

	it('renames a value to a new name', () => {
		expect(planOwnValueChange(angle, 'Lily', motifs)).toEqual({ kind: 'rename', name: 'Lily' });
	});

	it('treats a blank name as empty and the same name as unchanged', () => {
		expect(planOwnValueChange(angle, ' ', motifs)).toEqual({ kind: 'empty' });
		expect(planOwnValueChange(angle, 'Angle', motifs)).toEqual({ kind: 'unchanged' });
	});
});
