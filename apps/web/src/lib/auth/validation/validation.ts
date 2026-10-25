import { m } from '#lib/i18n/i18n.ts';

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
	const value = email.trim();
	if (!value) return m.validation.emailRequired;
	if (!EMAIL_PATTERN.test(value)) return m.validation.emailInvalid;
	return undefined;
}

export function validateRequiredPassword(password: string): string | undefined {
	if (!password) return m.validation.passwordRequired;
	return undefined;
}

export function validateNewPassword(password: string): string | undefined {
	if (!password) return m.validation.passwordRequired;
	if (password.length < MIN_PASSWORD_LENGTH) {
		return m.validation.passwordTooShort(MIN_PASSWORD_LENGTH);
	}
	return undefined;
}
