import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { validateEmail, validateNewPassword, validateRequiredPassword } from './validation.ts';

describe('validateEmail', () => {
	it('accepts a full address and ignores surrounding spaces', () => {
		expect(validateEmail(' learner@example.com ')).toBeUndefined();
	});

	it('asks for an address when empty', () => {
		expect(validateEmail('  ')).toBe(m.validation.emailRequired);
	});

	it('rejects an address without a domain suffix', () => {
		expect(validateEmail('learner@example')).toBe(m.validation.emailInvalid);
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
	it('rejects a short password and says the minimum length', () => {
		expect(validateNewPassword('barok')).toBe('Twoje hasło musi mieć co najmniej 8 znaków.');
		expect(validateNewPassword('a')).toBe(m.validation.passwordTooShort(8));
	});

	it('accepts eight characters', () => {
		expect(validateNewPassword('vermeer1')).toBeUndefined();
	});
});
