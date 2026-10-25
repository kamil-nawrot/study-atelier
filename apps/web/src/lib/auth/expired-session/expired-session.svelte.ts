import type { ServiceErrorLike } from '#lib/auth/types/service-error-like.ts';

const authorizationCodes = new Set(['PGRST301', 'PGRST302', 'PGRST303']);

export const sessionEnded = $state({ value: false });

export function isAuthorizationError(error: ServiceErrorLike): boolean {
	return error.status === 401 || (error.code !== undefined && authorizationCodes.has(error.code));
}
