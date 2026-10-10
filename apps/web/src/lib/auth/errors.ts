import { m } from '#lib/i18n/index.ts';

type AuthErrorLike = {
	code?: string;
	status?: number;
	name?: string;
};

const messagesByCode: Record<string, string> = {
	invalid_credentials: m.authErrors.invalidCredentials,
	email_not_confirmed: m.authErrors.emailNotConfirmed,
	weak_password: m.authErrors.weakPassword,
	same_password: m.authErrors.samePassword,
	over_request_rate_limit: m.authErrors.rateLimited,
	over_email_send_rate_limit: m.authErrors.emailRateLimited,
	email_address_invalid: m.validation.emailInvalid
};

export function authErrorMessage(error: AuthErrorLike): string {
	if (error.code && error.code in messagesByCode) return messagesByCode[error.code];
	if (error.name === 'AuthRetryableFetchError') return m.authErrors.network;
	if (error.status === 429) return m.authErrors.rateLimited;
	return m.common.unexpectedError;
}
