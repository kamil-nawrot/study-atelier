import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { validateEmail, validateNewPassword, validateRequiredPassword } from './validation';

describe('validateEmail', () => {
	it('accepts a full address and ignores surrounding spaces', () => {
		expect(validateEmail(' anna@przyklad.pl ')).toBeUndefined();
	});

	it('asks for an address when empty', () => {
		expect(validateEmail('  ')).toBe(m.validation.emailRequired);
	});

	it('rejects an address without a domain suffix', () => {
		expect(validateEmail('anna@przyklad')).toBe(m.validation.emailInvalid);
	});
});

describe('validateRequiredPassword', () => {
	it('asks for a password when empty', () => {
		expect(validateRequiredPassword('')).toBe(m.validation.passwordRequired);
	});

	it('accepts any non-empty password', () => {
		expect(validateRequiredPassword('abc')).toBeUndefined();
	});
});

describe('validateNewPassword', () => {
	it('rejects a short password and says how long it is', () => {
		expect(validateNewPassword('barok')).toBe('Hasło ma 5 znaków. Potrzeba co najmniej 8.');
	});

	it('uses the singular form for one character', () => {
		expect(validateNewPassword('a')).toBe('Hasło ma 1 znak. Potrzeba co najmniej 8.');
	});

	it('uses the few form for two to four characters', () => {
		expect(validateNewPassword('abc')).toBe('Hasło ma 3 znaki. Potrzeba co najmniej 8.');
	});

	it('accepts eight characters', () => {
		expect(validateNewPassword('vermeer1')).toBeUndefined();
	});
});
